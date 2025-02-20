import { AutoIncrement, ObjectStore } from './schema.js';
import { ReadWriteTransaction } from './transactions.js';
import type { Store } from './database.js';
import type { UpgradingKey } from './schema.js';
import type { Promisable } from 'type-fest';

/** Store builder. */
export class StoreBuilder extends ObjectStore {
  /**
   * Adds an index to the object store.
   * @param name - The name of the index.
   * @param keyPath - Path or paths to the indexed keys.
   * @param options - Indexing options.
   * @returns This {@link StoreBuilder} instance.
   */
  createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters) {
    this.handle.createIndex(name, keyPath, options);
    return this;
  }

  /**
   * Deletes an index of the object store.
   * @param name - The name of the index.
   * @returns This {@link StoreBuilder} instance.
   */
  dropIndex(name: string) {
    this.handle.deleteIndex(name);
    return this;
  }
}

/** Indices available during migrations. */
export type UpgradeableIndices = Record<string, UpgradingKey>;

/** Store schema available during migrations. */
export type UpgradeableStore = Store<Record<string, unknown>, UpgradingKey, UpgradeableIndices>;

/** Schema available during migrations. */
export type UpgradeableSchema = Record<string, UpgradeableStore>;

/**
 * Database Builder transaction.
 *
 * Do not mix other asynchronous operations with IndexedDB operations
 * within a transaction, the transaction will timeout.
 */
export class DatabaseBuilder extends ReadWriteTransaction<UpgradeableSchema> {
  /**
   * Alters an object store in the database within the transaction.
   * @param name - The name of the store.
   * @returns A {@link StoreBuilder} for the store.
   */
  alterStore(name: string) {
    return new StoreBuilder(this.handle.objectStore(name));
  }

  /**
   * Create an object store in the database within the transaction.
   * @param name - The name of the store.
   * @returns A {@link StoreBuilder} for the store.
   */
  createStore(name: string): StoreBuilder;
  /**
   * Create an object store in the database within the transaction.
   * @param name - The name of the store.
   * @param autoIncrement - Indicates an auto increment key.
   * @returns A {@link StoreBuilder} for the store.
   */
  createStore(name: string, autoIncrement: AutoIncrement): StoreBuilder;
  /**
   * Create an object store in the database within the transaction.
   * @param name - The name of the store.
   * @param keyPath - The path to the primary key.
   * @returns A {@link StoreBuilder} for the store.
   */
  createStore(name: string, keyPath: string | string[]): StoreBuilder;
  /** The {@link createStore} implementation. */
  createStore(name: string, keyPath?: AutoIncrement | string | string[]) {
    const keyInfo = Array.isArray(keyPath) || typeof keyPath === 'string' ? { keyPath } : {};
    const incInfo = keyPath === AutoIncrement ? { autoIncrement: true } : {};

    return new StoreBuilder(this.handle.db.createObjectStore(name, { ...keyInfo, ...incInfo }));
  }

  /**
   * Deletes an object store in the database within the transaction.
   * @param name - The name of the store.
   */
  dropStore(name: string) {
    this.handle.db.deleteObjectStore(name);
  }
}

/**
 * Migration function.
 * @param transaction - The migration transaction.
 */
export type Migration = (transaction: DatabaseBuilder) => Promisable<unknown>;
