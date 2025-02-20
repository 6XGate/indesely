import { withResolvers } from './compat.js';
import { DatabaseBuilder } from './migrations.js';
import { ReadOnlyTransaction, ReadWriteTransaction } from './transactions.js';
import { getMessage, requestDatabasePersistence } from './utilities.js';
import type { Migration } from './migrations.js';
import type { AutoIncrement, ManualKey, MemberPaths, UpgradingKey } from './schema.js';
import type { Promisable } from 'type-fest';

export class MigrationError extends Error {
  override readonly name = 'MigrationError';
  readonly migration;
  constructor(migration: string | null | undefined, cause: unknown) {
    super(
      migration
        ? `Error in migration "${migration}": ${getMessage(cause)}`
        : `Error before starting migrations: ${getMessage(cause)}`,
      { cause },
    );
    this.migration = migration;
  }
}

/**
 * IndexedDB database connection.
 *
 * @todo Add event handling support for the versionchange event.
 */
class Connection<Schema extends Record<string, object>> {
  /** The database handle. */
  readonly #handle;

  /** @internal */
  constructor(db: IDBDatabase) {
    this.#handle = db;
  }

  /** Gets the database name. */
  get name() {
    return this.#handle.name;
  }

  /** Gets the database version. */
  get version() {
    return this.#handle.version;
  }

  /** Gets the name of all the object stores. */
  get stores() {
    return Array.from(this.#handle.objectStoreNames);
  }

  /**
   * Starts a read-only transaction.
   * @param stores - The stores to include in the transaction.
   * @param scope - The scope of operations to perform in the transaction.
   * @returns The result returned from the {@link scope} callback.
   */
  async read<Stores extends keyof Schema, Result>(
    stores: readonly Stores[],
    scope: (trx: ReadOnlyTransaction<Pick<Schema, Stores>>) => Promisable<Result>,
  ) {
    const native = this.#handle.transaction(stores.map(String), 'readwrite');
    const trx = new ReadOnlyTransaction<Pick<Schema, Stores>>(native);

    return await trx.run(scope);
  }

  /**
   * Starts a read-write transaction.
   * @param stores - The stores to include in the transaction.
   * @param scope - The scope of operations to perform in the transaction.
   * @returns The result returned from the {@link scope} callback.
   */
  async change<Stores extends keyof Schema, Result>(
    stores: readonly Stores[],
    scope: (trx: ReadWriteTransaction<Pick<Schema, Stores>>) => Promisable<Result>,
  ) {
    const native = this.#handle.transaction(stores.map(String), 'readwrite');
    const trx = new ReadWriteTransaction<Pick<Schema, Stores>>(native);

    return await trx.run(scope);
  }

  close() {
    this.#handle.close();
  }
}

/** All possible key paths or sources for a store's model. */
type PossibleKeys<Row> = ManualKey | AutoIncrement | UpgradingKey | MemberPaths<Row> | MemberPaths<Row>[];

type PossibleIndices<Row> = Record<string, UpgradingKey> | Record<string, MemberPaths<Row> | MemberPaths<Row>[]>;

/**
 * Defines a store in an IndexedDB database.
 *
 * Key paths currently only support the direct members of the document itself.
 *
 * @template Row - The shape of the document.
 * @template Key - The path or paths to the primary key.
 * @template Indices - Named indices and their path or paths.
 */
export type Store<
  Row extends object,
  Key extends PossibleKeys<Row> = ManualKey,
  Indices extends PossibleIndices<Row> = Record<PropertyKey, never>,
> = { row: Row; key: Key; indices: Indices };

/** Database definition options. */
interface DefineDatabaseOptions {
  /** The name of the database. */
  name: string;
  /** Migrations. */
  migrations: [Migration, ...Migration[]];
  /** Should store persistence be required from the user. */
  persist?: boolean | undefined;
}

/**
 * Defines an IndexedDB database connection factory.
 * @param options - Database definition options.
 * @returns The database connection factory.
 */
export function defineDatabase<Schema extends Record<string, object>>(options: DefineDatabaseOptions) {
  const { name, migrations, persist = false } = options;

  /** The real database connection, but use {@link readyDatabase} instead. */
  let connection: Connection<Schema> | null = null;
  async function readyDatabase() {
    if (connection != null) return connection;
    const { promise, resolve, reject } = withResolvers<Connection<Schema>>();

    // HACK: To skip the persisted check when not request, just set it to `true`.
    const persisted = persist ? await requestDatabasePersistence() : true;
    if (!persisted) {
      console.warn('Databases will not persist, user denied request');
    }

    const version = migrations.length;
    const request = globalThis.indexedDB.open(name, version);

    request.onsuccess = () => {
      connection = new Connection<Schema>(request.result);
      resolve(connection);
    };

    /* v8 ignore next 4 -- Hard to reliability test */
    request.onblocked = () => {
      reject(new Error(`Database "${name}" is being upgraded by another tab or window`));
      request.result.close();
    };

    let migrationError: MigrationError | null = null;
    request.onupgradeneeded = async function migrateDatabase(ev) {
      /* v8 ignore next 1 -- Hard to forcibly test */
      if (request.transaction == null) throw new Error('No transaction');
      const migrator = new DatabaseBuilder(request.transaction);
      let name: string | undefined;
      try {
        await migrator.run(async (trx) => {
          let version = ev.oldVersion;
          for (const migration of migrations.slice(ev.oldVersion)) {
            version += 1;
            name = migration.name ? migration.name : String(version);
            await migration(trx);
          }
        });
      } catch (err) {
        migrationError = new MigrationError(name, err);
      }
    };

    request.onerror = () => {
      /* v8 ignore next 2 -- Hard to forcibly test */
      if (request.error == null) {
        reject(new Error('Unknown connect failure'));
      } else if (request.error.name === 'AbortError' && migrationError != null) {
        reject(migrationError);
      } else {
        reject(request.error);
      }
    };

    return await promise;
  }

  /** Gets the database name. */
  async function getName() {
    return await readyDatabase().then((db) => db.name);
  }

  /** Gets the database version. */
  async function getVersion() {
    return await readyDatabase().then((db) => db.version);
  }

  /** Gets the name of all the object stores. */
  async function getStores() {
    return await readyDatabase().then((db) => db.stores);
  }

  /**
   * Starts a read-only transaction.
   * @param stores - The stores to include in the transaction.
   * @param scope - The scope of operations to perform in the transaction.
   * @returns The result returned from the {@link scope} callback.
   */
  async function read<Stores extends keyof Schema, Result>(
    stores: readonly Stores[],
    scope: (trx: ReadOnlyTransaction<Pick<Schema, Stores>>) => Promisable<Result>,
  ) {
    return await readyDatabase().then(async (db) => await db.read(stores, scope));
  }

  /**
   * Starts a read-write transaction.
   * @param stores - The stores to include in the transaction.
   * @param scope - The scope of operations to perform in the transaction.
   * @returns The result returned from the {@link scope} callback.
   */
  async function change<Stores extends keyof Schema, Result>(
    stores: readonly Stores[],
    scope: (trx: ReadWriteTransaction<Pick<Schema, Stores>>) => Promisable<Result>,
  ) {
    return await readyDatabase().then(async (db) => await db.change(stores, scope));
  }

  /**
   * Closes the database connection.
   *
   * If the database connection has been opened, then {@link close} will close
   * the connection handle and reset the connection. The connection will be
   * reopened if any other method is called.
   */
  function close() {
    connection?.close();
    connection = null;
  }

  const database = {
    getName,
    getVersion,
    getStores,
    read,
    change,
    close,
  };

  return () => database;
}

/** A database factory. */
export type DatabaseFactory<Schema extends Record<string, object>> = ReturnType<typeof defineDatabase<Schema>>;

/** A database connection. */
export type Database<Schema extends Record<string, object>> = ReturnType<DatabaseFactory<Schema>>;

/**
 * Attempts to delete a database.
 * @param name - The name of the database to delete.
 */
export async function dropDatabase(name: string) {
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Buggy bugger
  const { promise, resolve, reject } = withResolvers<void>();

  const request = globalThis.indexedDB.deleteDatabase(name);
  request.onsuccess = () => resolve();
  /* v8 ignore next 2 -- Hard to forcibly test */
  request.onerror = () => reject(request.error ?? new Error('Unknown request failure'));
  request.onblocked = () => reject(new Error(`Database "${name}" is being upgraded by another tab or window`));

  await promise;
}

/** Attempts to get a list of all databases. */
export async function listDatabases() {
  const databases = await globalThis.indexedDB.databases();
  return databases.map(({ name }) => name).filter((name): name is string => Boolean(name));
}
