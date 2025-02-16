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
    this.#next = () => {
      /* nothing initially */
    };
  }

  /** Gets the index key, or primary key when not using an index, of the current document pointed to by the cursor. */
  get key() {
    return this.handle.key as Key;
  }

  /** Gets the primary key of the current document pointed to by the cursor. */
  get primaryKey() {
    return this.handle.primaryKey as PrimaryKey;
  }

  /** Advances the cursor {@link count} number of iteration. */
  advance(count: number) {
    this.#next = () => this.handle.advance(count);
  }

  /** Continues to the next {@link key}; and optionally, {@link primaryKey} */
  continue(key: Key, primaryKey?: PrimaryKey) {
    this.#next =
      primaryKey != null
        ? () => this.handle.continue(key as IDBValidKey)
        : () => this.handle.continuePrimaryKey(key as IDBValidKey, primaryKey as IDBValidKey);
  }

  /** Deletes the current document pointed to by the cursor. */
  async delete() {
    await waitOnRequest(this.handle.delete());
  }

  /** Updates the current document pointed to by the cursor. */
  async update(document: Row) {
    const key = await waitOnRequest(this.handle.update(document));
    return key as Key;
  }

  /**
   * Iterates the cursor.
   * @internal
   */
  async *[Symbol.asyncIterator]() {
    let { promise, resolve, reject } = withResolvers<this | null>();

    const request = this.#request;

    request.onerror = () => {
      reject(request.error ?? new Error('Unknown cursor error'));
    };

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
