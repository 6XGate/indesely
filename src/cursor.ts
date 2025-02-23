import { withResolvers } from './compat';
import { waitOnRequest } from './utilities';

export class Cursor<Row, Key, PrimaryKey, Input extends IDBCursor | IDBCursorWithValue> {
  /** The cursor request. */
  readonly #request;
  /**
   * The cursor handle.
   * @internal
   */
  protected handle;
  /** The next handler. */
  #next;

  /** @internal */
  constructor(request: IDBRequest<Input | null>) {
    this.#request = request;

    // Unknown to be good when iterating.
    this.handle = null as unknown as Input;
    /* v8 ignore next 3 -- Not testable since, not called */
    this.#next = () => {
      /* nothing initially */
    };
  }

  /** Gets the index key, or primary key when not using an index, of the current record pointed to by the cursor. */
  get key() {
    return this.handle.key as Key;
  }

  /** Gets the primary key of the current record pointed to by the cursor. */
  get primaryKey() {
    return this.handle.primaryKey as PrimaryKey;
  }

  /**
   * Advances the cursor a given number of iteration.
   * @param count - The number of iterations to advance the cursor.
   */
  advance(count: number) {
    this.#next = () => this.handle.advance(count);
  }

  /**
   * Continues to the next record that matches the provided keys.
   * @param key - The key at which to position the cursor.
   * @param primaryKey - The primary key at which to position the cursor.
   */
  continue(key: Key, primaryKey?: PrimaryKey) {
    this.#next =
      primaryKey != null
        ? () => this.handle.continuePrimaryKey(key as IDBValidKey, primaryKey as IDBValidKey)
        : () => this.handle.continue(key as IDBValidKey);
  }

  /** Deletes the current record pointed to by the cursor. */
  async delete() {
    await waitOnRequest(this.handle.delete());
  }

  /**
   * Updates the current record pointed to by the cursor.
   * @param record - The record with which to replace the current record.
   * @returns - The key for the updated record.
   */
  async update(record: Row) {
    const key = await waitOnRequest(this.handle.update(record));
    return key as PrimaryKey;
  }

  /**
   * Iterates the cursor.
   * @internal
   */
  async *[Symbol.asyncIterator]() {
    let { promise, resolve, reject } = withResolvers<this | null>();

    const request = this.#request;

    /* v8 ignore next 1 -- Hard to forcibly test */
    request.onerror = () => reject(request.error ?? new Error('Unknown cursor error'));

    request.onsuccess = () => {
      if (request.result == null) {
        resolve(null);
        return;
      }

      this.handle = request.result;
      this.#next = () => this.handle.continue();

      resolve(this);
      ({ promise, resolve, reject } = withResolvers<this | null>());
    };

    // eslint-disable-next-line no-await-in-loop -- This is a cursor, so must be serial.
    for (let cursor = await promise; cursor != null; cursor = await promise) {
      yield cursor;
      this.#next();
    }
  }
}

export class KeyCursor<Row, Key, PrimaryKey> extends Cursor<Row, Key, PrimaryKey, IDBCursor> {
  // No additional member needed.
}

export class ValueCursor<Row, Key, PrimaryKey> extends Cursor<Row, Key, PrimaryKey, IDBCursorWithValue> {
  get value() {
    return this.handle.value as Row;
  }
}
