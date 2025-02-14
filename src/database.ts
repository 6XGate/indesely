import { memoize } from './compat.js';
import { DatabaseBuilder } from './migrations.js';
import { ReadOnlyTransaction, ReadWriteTransaction } from './transactions.js';
import { requestDatabasePersistence, waitOnRequest } from './utilities.js';
import type { Migration } from './migrations.js';
import type { AutoIncrement, ManualKey, MemberPaths } from './utilities.js';

/**
 * IndexedDB database connection.
 *
 * @todo Add event handling support for the versionchange event.
 */
class Database<Schema extends Record<string, object>> {
  readonly #handle;

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
    scope: (trx: ReadOnlyTransaction<Pick<Schema, Stores>>) => Promise<Result>,
  ) {
    const trx = this.#handle.transaction(stores.map(String), 'readonly');
    try {
      const result = await scope(new ReadOnlyTransaction<Pick<Schema, Stores>>(trx));
      trx.commit();
      return result;
    } catch (error) {
      trx.abort();
      throw error;
    }
  }

  /**
   * Starts a read-write transaction.
   * @param stores - The stores to include in the transaction.
   * @param scope - The scope of operations to perform in the transaction.
   * @returns The result returned from the {@link scope} callback.
   */
  async change<Stores extends keyof Schema, Result>(
    stores: readonly Stores[],
    scope: (trx: ReadWriteTransaction<Pick<Schema, Stores>>) => Promise<Result>,
  ) {
    const trx = this.#handle.transaction(stores.map(String), 'readwrite');
    try {
      const result = await scope(new ReadWriteTransaction<Pick<Schema, Stores>>(trx));
      trx.commit();
      return result;
    } catch (error) {
      trx.abort();
      throw error;
    }
  }
}

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
  Key extends ManualKey | AutoIncrement | MemberPaths<Row> | MemberPaths<Row>[] = ManualKey,
  Indices extends Record<string, MemberPaths<Row> | MemberPaths<Row>[]> = Record<PropertyKey, never>,
> = { row: Row; key: Key; indices: Indices };

/** Database definition options. */
interface DefineDatabaseOptions {
  /** The name of the database. */
  name: string;
  /** Migrations. */
  migrations: Migration[];
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

  const readyDatabase = memoize(async function readyDatabase() {
    // HACK: To skip the persisted check when not request, just set it to `true`.
    const persisted = persist ? await requestDatabasePersistence() : true;
    if (!persisted) {
      console.warn('Databases will not persist, user denied request');
    }

    const version = migrations.length;
    const request = globalThis.indexedDB.open(name, version);

    request.onblocked = () => {
      request.result.close();
      throw new Error(`Database "${name}" is being upgraded by another tab or window`);
    };

    request.onupgradeneeded = function migrateDatabase(ev) {
      if (request.transaction == null) throw new Error('No transaction');
      const migrator = new DatabaseBuilder(request.transaction);
      for (const migration of migrations.slice(ev.oldVersion)) {
        migration(migrator);
      }
    };

    return new Database<Schema>(await waitOnRequest(request));
  });

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
    scope: (trx: ReadOnlyTransaction<Pick<Schema, Stores>>) => Promise<Result>,
  ) {
    return await readyDatabase().then(async (db) => db.read(stores, scope));
  }

  /**
   * Starts a read-write transaction.
   * @param stores - The stores to include in the transaction.
   * @param scope - The scope of operations to perform in the transaction.
   * @returns The result returned from the {@link scope} callback.
   */
  async function change<Stores extends keyof Schema, Result>(
    stores: readonly Stores[],
    scope: (trx: ReadWriteTransaction<Pick<Schema, Stores>>) => Promise<Result>,
  ) {
    return await readyDatabase().then(async (db) => db.change(stores, scope));
  }

  return memoize(() => ({
    getName,
    getVersion,
    getStores,
    read,
    change,
  }));
}

/**
 * Attempts to delete a database.
 * @param name - The name of the database to delete.
 *
 * @todo Not sure what we should do about the blocked event yet.
 */
export async function dropDatabase(name: string) {
  const request = globalThis.indexedDB.deleteDatabase(name);
  request.onblocked = () => {
    request.result.close();
    throw new Error(`Database "${name}" is being upgraded by another tab or window`);
  };

  await waitOnRequest(request);
}

/** Attempts to get a list of all databases. */
export async function listDatabases() {
  const dbs = await globalThis.indexedDB.databases();
  return dbs.map(({ name }) => name).filter((name): name is string => Boolean(name));
}
