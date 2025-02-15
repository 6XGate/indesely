import { DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder, UpdateQueryBuilder } from './builders.js';
import { withResolvers } from './compat.js';
import type { StoreIndices, StoreKey, StoreRow } from './utilities.js';
import type { Promisable } from 'type-fest';

export class Transaction {
  readonly handle;

  constructor(transaction: IDBTransaction) {
    this.handle = transaction;
  }

  async run<Result>(scope: (trx: this) => Promisable<Result>) {
    const { promise, resolve, reject } = withResolvers<Result>();
    const trx = this.handle;

    try {
      const result = await scope(this);

      trx.oncomplete = () => resolve(result);
      trx.onerror = () => reject(trx.error ?? new Error('Unknown transaction error'));
      trx.commit();

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
    return new SelectQueryBuilder<StoreRow<Schema[Store]>, StoreKey<Schema[Store]>, StoreIndices<Schema[Store]>>(
      this.handle.objectStore(String(store)),
    );
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
   * Starts an insertion query within the transaction.
   * @param store - The name of the object store.
   * @returns A {@link InsertQueryBuilder} to build and execute an insertion query.
   */
  insertInto<Store extends keyof Schema>(store: Store) {
    return new InsertQueryBuilder<StoreRow<Schema[Store]>, StoreKey<Schema[Store]>>(
      this.handle.objectStore(String(store)),
    );
  }

  /**
   * Starts an update query within the transaction.
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
