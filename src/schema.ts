import { AutoIncrement } from './utilities.js';

/**
 * Index schema builder.
 */
export class IndexSchemaBuilder {
  readonly #handle;

  constructor(store: IDBObjectStore) {
    this.#handle = store;
  }

  /**
   * Adds an index to the object store.
   * @param name - The name of the index.
   * @param keyPath - Path or paths to the indexed keys.
   * @param options - Indexing options.
   * @returns This {@link IndexSchemaBuilder} instance.
   */
  createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters) {
    this.#handle.createIndex(name, keyPath, options);
    return this;
  }

  /**
   * Deletes an index of the object store.
   * @param name - The name of the index.
   * @returns This {@link IndexSchemaBuilder} instance.
   */
  deleteIndex(name: string) {
    this.#handle.deleteIndex(name);
    return this;
  }
}

/**
 * Update transaction.
 *
 * Do not mix other asynchronous operations with IndexedDB operations
 * within a transaction, the transaction will timeout.
 */
export class UpgradeTransaction {
  readonly #handle;

  constructor(transaction: IDBTransaction) {
    this.#handle = transaction;
  }

  /**
   * Alters an object store in the database within the transaction.
   * @param name - The name of the store.
   * @returns A {@link IndexSchemaBuilder} for the store.
   */
  alterStore(name: string) {
    return new IndexSchemaBuilder(this.#handle.objectStore(name));
  }

  /**
   * Create an object store in the database within the transaction.
   * @param name - The name of the store.
   * @returns A {@link IndexSchemaBuilder} for the store.
   */
  createStore(name: string): IndexSchemaBuilder;
  /**
   * Create an object store in the database within the transaction.
   * @param name - The name of the store.
   * @param autoIncrement - Indicates an auto increment key.
   * @returns A {@link IndexSchemaBuilder} for the store.
   */
  createStore(name: string, autoIncrement: AutoIncrement): IndexSchemaBuilder;
  /**
   * Create an object store in the database within the transaction.
   * @param name - The name of the store.
   * @param keyPath - The path to the primary key.
   * @returns A {@link IndexSchemaBuilder} for the store.
   */
  createStore(name: string, keyPath: string | string[]): IndexSchemaBuilder;
  /** The {@link createStore} implementation. */
  createStore(name: string, keyPath?: AutoIncrement | string | string[]) {
    const keyInfo = Array.isArray(keyPath) || typeof keyPath === 'string' ? { keyPath } : {};
    const incInfo = keyPath === AutoIncrement ? { autoIncrement: true } : {};

    return new IndexSchemaBuilder(this.#handle.db.createObjectStore(name, { ...keyInfo, ...incInfo }));
  }

  /**
   * Deletes an object store in the database within the transaction.
   * @param name - The name of the store.
   */
  deleteStore(name: string) {
    this.#handle.db.deleteObjectStore(name);
  }
}

/**
 * Migration function.
 * @param transaction - The migration transaction.
 */
export type Migration = (transaction: UpgradeTransaction) => void;
