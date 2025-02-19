import { DeleteQueryBuilder, SelectQueryBuilder, UpdateQueryBuilder } from './builders.js';
import { withResolvers } from './compat.js';
import { ObjectStore } from './schema.js';
import type { StoreIndices, StoreKey, StoreRow } from './schema.js';
import type { Promisable } from 'type-fest';

/** An IndexedDB transaction. */
export class Transaction {
  /**
   * The native {@link IDBTransaction} handle.
   * @internal
   */
  protected readonly handle;

  /** @internal */
  constructor(transaction: IDBTransaction) {
    this.handle = transaction;
  }

  /**
   * Gets an information about an object store.
   * @param name - The name of the object store.
   */
  getObjectStore(name: string) {
    return new ObjectStore(this.handle.objectStore(name));
  }

  /**
   * Runs the callback {@link scope} within the transaction.
   * @internal
   */
  async run<Result>(scope: (trx: this) => Promisable<Result>) {
    const { promise, resolve, reject } = withResolvers<Result>();
    const trx = this.handle;

    try {
      const result = await scope(this);

      trx.oncomplete = () => resolve(result);
      trx.onerror = () => reject(trx.error ?? new Error('Unknown transaction error'));
      trx.onabort = () => reject(trx.error ?? new Error('Transaction aborted'));

      return await promise;
    } catch (error) {
      trx.abort();
      throw error;
    }
  }
}

/**
 * Read-only transaction.
 *
 * Do not mix other asynchronous operations with IndexedDB operations
 * within a transaction, the transaction will timeout.
 */
export class ReadOnlyTransaction<Schema extends Record<string, object>> extends Transaction {
  /**
   * Starts a selection query within the transaction.
   * @param store - The name of the object store.
   * @returns A {@link SelectQueryBuilder} to build and execute a selection query.
   */
  selectFrom<Store extends keyof Schema>(store: Store) {
    return new SelectQueryBuilder<StoreRow<Schema[Store]>, StoreKey<Schema[Store]>, StoreIndices<Schema[Store]>>({
      store: this.handle.objectStore(String(store)),
    });
  }
}

/**
 * Read-write transaction.
 *
 * Do not mix other asynchronous operations with IndexedDB operations
 * within a transaction, the transaction will timeout.
 */
export class ReadWriteTransaction<Schema extends Record<string, object>> extends ReadOnlyTransaction<Schema> {
  /**
   * Starts an insertion or update query within the transaction.
   * @param store - The name of the object store.
   * @returns A {@link UpdateQueryBuilder} to build and execute an update query.
   */
  update<Store extends keyof Schema>(store: Store) {
    return new UpdateQueryBuilder<StoreRow<Schema[Store]>, StoreKey<Schema[Store]>>(
      this.handle.objectStore(String(store)),
    );
  }

  /**
   * Starts a deletion query within the transaction.
   * @param store - The name of the object store.
   * @returns A {@link DeleteQueryBuilder} to build and execute a deletion query.
   */
  deleteFrom<Store extends keyof Schema>(store: Store) {
    return new DeleteQueryBuilder<StoreRow<Schema[Store]>, StoreKey<Schema[Store]>>(
      this.handle.objectStore(String(store)),
    );
  }
}
