import { KeyCursor, ValueCursor } from './cursor.js';
import { isClass, waitOnRequest } from './utilities.js';
import type { AutoIncrement, ManualKey, MemberPaths, MemberType, UpgradingKey } from './utilities.js';

/** Comparison operators of the where clause. */
type Compares = '=' | '<' | '<=' | '>=' | '>';
/** Bounds operators of the where clause. */
type Bounds = '[]' | '()' | '(]' | '[)';
/** Operators of the where clause. */
type Operators = Compares | Bounds;

/** Where clause functions, use to exclude them from the builder when once called. */
type Where = 'whereKey' | 'where';

/** Gets the type of the key of a row */
type KeyOf<Row extends object, Key> =
  Key extends MemberPaths<Row>
    ? MemberType<Row, Key>
    : Key extends AutoIncrement
      ? number
      : Key extends ManualKey
        ? IDBValidKey
        : Key extends UpgradingKey
          ? IDBValidKey
          : never;

/** Gets the necessary _add_ and _put_ parameters for a row. */
type UpdateArgsFor<Row extends object, Key> =
  Key extends MemberPaths<Row>
    ? [document: Row]
    : Key extends AutoIncrement
      ? [document: Row]
      : Key extends ManualKey
        ? [document: Row, key: IDBValidKey]
        : Key extends UpgradingKey
          ? [document: Row, key?: IDBValidKey]
          : never;

async function waitForRow<Row>(request: IDBRequest<Row | undefined>) {
  const row = await waitOnRequest(request);
  return row ?? null;
}

/**
 * Read query builder.
 *
 * @todo Support cursor advancement via keys, which will likely be a different method from {@link stream}.
 */
export class SelectQueryBuilder<Row extends object, Key, Indices extends object, CursorKey = Key> {
  /** IndexedDB {@link IDBObjectStore} handle. */
  readonly #handle;
  /** Select by key range. */
  #range: IDBKeyRange | null = null;
  /** Select by index range. */
  #index: [name: keyof Indices, range: IDBKeyRange] | null = null;

  /** @internal */
  constructor(store: IDBObjectStore) {
    this.#handle = store;
  }

  /** Gets the number of documents that matches the query. */
  async count() {
    if (this.#range != null) {
      return await waitOnRequest(this.#handle.count(this.#range));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.#handle.index(String(name)).count(range));
    }

    return await waitOnRequest(this.#handle.count());
  }

  /** Iterator a cursor for all documents that match the query via an asynchronous iterator. */
  async *cursor(direction?: IDBCursorDirection) {
    let request;
    if (this.#index != null) {
      const [name, range] = this.#index;
      request = this.#handle.index(String(name)).openCursor(range, direction);
    } else {
      request = this.#handle.openCursor(this.#range, direction);
    }

    const cursor = new ValueCursor<Row, KeyOf<Row, CursorKey>, KeyOf<Row, Key>>(request);

    yield* cursor;
  }

  /** Iterator a key cursor for all documents that match the query via an asynchronous iterator. */
  async *keyCursor(direction?: IDBCursorDirection) {
    let request;
    if (this.#index != null) {
      const [name, range] = this.#index;
      request = this.#handle.index(String(name)).openKeyCursor(range, direction);
    } else {
      request = this.#handle.openKeyCursor(this.#range, direction);
    }

    const cursor = new KeyCursor<Row, KeyOf<Row, CursorKey>, KeyOf<Row, Key>>(request);

    yield* cursor;
  }

  /** Creates a new asynchronous iterator, based on the current query. */
  [Symbol.asyncIterator]() {
    return this.stream();
  }

  /** Streams all documents that match the query via an asynchronous iterator. */
  async *stream(direction?: IDBCursorDirection): AsyncGenerator<Row, void, number | undefined> {
    for await (const cursor of this.cursor(direction)) {
      const advance = yield cursor.value;
      if (advance != null) cursor.advance(advance);
    }
  }

  /** Streams all keys for documents that match the query via an asynchronous iterator. */
  async *streamKeys(direction?: IDBCursorDirection): AsyncGenerator<KeyOf<Row, CursorKey>, void, number | undefined> {
    for await (const cursor of this.cursor(direction)) {
      const advance = yield cursor.key;
      if (advance != null) cursor.advance(advance);
    }
  }

  /** Streams all primary keys for documents that match the query via an asynchronous iterator. */
  async *streamPrimaryKeys(direction?: IDBCursorDirection): AsyncGenerator<KeyOf<Row, Key>, void, number | undefined> {
    for await (const cursor of this.cursor(direction)) {
      const advance = yield cursor.primaryKey;
      if (advance != null) cursor.advance(advance);
    }
  }

  /** Gets the documents that match the query. */
  async getAll(count?: number) {
    if (this.#range != null) {
      return await waitOnRequest(this.#handle.getAll<Row>(this.#range, count));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.#handle.index(String(name)).getAll<Row>(range, count));
    }

    return await waitOnRequest(this.#handle.getAll<Row>(null, count));
  }

  /** Gets the first document that matches the query, or `null` if none matches. */
  async getFirst() {
    if (this.#range != null) {
      return await waitForRow(this.#handle.get<Row>(this.#range));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitForRow(this.#handle.index(String(name)).get<Row>(range));
    }

    throw new SyntaxError('Missing where clause');
  }

  /**
   * Gets the first document that matches the query, or throws if none matches.
   * @param error - Optional error constructor or factory.
   */
  async getFirstOrThrow(error?: typeof Error | (() => Error)) {
    const result = await this.getFirst();
    if (result != null) {
      return result;
    }

    if (typeof error !== 'function') {
      throw new Error('No document not found');
    }

    if (isClass<Error>(error)) {
      throw new error('No document not found');
    }

    throw error();
  }

  /** Gets the primary keys for documents that match the query. */
  async getAllKeys(count?: number) {
    type PK = MemberType<Row, Key>;

    if (this.#range != null) {
      return await waitOnRequest(this.#handle.getAllKeys<PK>(this.#range, count));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.#handle.index(String(name)).getAllKeys<PK>(range, count));
    }

    return await waitOnRequest(this.#handle.getAllKeys<PK>(null, count));
  }

  /** Gets the primary key for the first document that matches the query, or `null` if none matches. */
  async getFirstKey() {
    type PK = MemberType<Row, Key>;

    if (this.#range != null) {
      return await waitOnRequest(this.#handle.getKey<PK>(this.#range));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.#handle.index(String(name)).getKey<PK>(range));
    }

    throw new SyntaxError('Missing where clause');
  }

  /**
   * Gets the primary key for the first document that matches the query, or throws if none matches.
   * @param error - Optional error constructor or factory.
   */
  async getFirstKeyOrThrow(error?: typeof Error | (() => Error)) {
    const key = await this.getFirstKey();
    if (key != null) {
      return key;
    }

    if (typeof error !== 'function') {
      throw new Error('No document not found');
    }

    if (isClass<Error>(error)) {
      throw new error('No document not found');
    }

    throw error();
  }

  /**
   * Adds a where clause to the query to compare an index with a value.
   * @param index - Name of the index with which to compare the value.
   * @param op - The comparison operation.
   * @param value - The value with which to compare the index.
   * @returns This {@link SelectQueryBuilder} instance.
   */
  where<Index extends keyof Indices>(
    index: Index,
    op: Compares,
    value: MemberType<Row, Indices[Index]>,
  ): Omit<SelectQueryBuilder<Row, Key, Indices, Indices[Index]>, Where>;
  /**
   * Adds a where clause to the query to compares an index with a bounds.
   * @param index - Name of the index with which to compare the bounds.
   * @param op - The bounds operation.
   * @param lower - The lower bounds with which to compare the index.
   * @param upper - The upper bounds with which to compare the index.
   * @returns This {@link SelectQueryBuilder} instance.
   */
  where<Index extends keyof Indices>(
    index: Index,
    op: Bounds,
    lower: MemberType<Row, Indices[Index]>,
    upper: MemberType<Row, Indices[Index]>,
  ): Omit<SelectQueryBuilder<Row, Key, Indices, Indices[Index]>, Where>;
  /** The {@link where} implementation. */
  where<Index extends keyof Indices>(
    index: Index,
    op: Operators,
    first: MemberType<Row, Indices[Index]>,
    last?: MemberType<Row, Indices[Index]>,
  ) {
    if (this.#range != null || this.#index != null) {
      throw new SyntaxError('where clause cannot be redefined');
    }

    switch (op) {
      case '=':
        this.#index = [index, IDBKeyRange.only(first)];
        return this;
      case '<':
        this.#index = [index, IDBKeyRange.upperBound(first, true)];
        return this;
      case '<=':
        this.#index = [index, IDBKeyRange.upperBound(first)];
        return this;
      case '>=':
        this.#index = [index, IDBKeyRange.lowerBound(first)];
        return this;
      case '>':
        this.#index = [index, IDBKeyRange.lowerBound(first, true)];
        return this;
    }

    if (last == null) throw new SyntaxError(`Missing upper bounds for "${op}" operator`);

    switch (op) {
      case '[]':
        this.#index = [index, IDBKeyRange.bound(first, last, false, false)];
        return this;
      case '(]':
        this.#index = [index, IDBKeyRange.bound(first, last, true, false)];
        return this;
      case '()':
        this.#index = [index, IDBKeyRange.bound(first, last, true, true)];
        return this;
      case '[)':
        this.#index = [index, IDBKeyRange.bound(first, last, false, true)];
        return this;
      default:
        throw new SyntaxError(`Unknown operator ${String(op)}`);
    }
  }

  /**
   * Adds a where clause to the query to compare the primary key with a value.
   * @param op - The comparison operation.
   * @param value - The value with which to compare the primary key.
   * @returns This {@link SelectQueryBuilder} instance.
   */
  whereKey(op: Compares, value: KeyOf<Row, Key>): Omit<this, Where>;
  /**
   * Adds a where clause to the query to compares the primary key with a bounds.
   * @param op - The bounds operation.
   * @param lower - The lower bounds with which to compare the primary key.
   * @param upper - The upper bounds with which to compare the primary key.
   * @returns This {@link SelectQueryBuilder} instance.
   */
  whereKey(op: Bounds, lower: KeyOf<Row, Key>, upper: KeyOf<Row, Key>): Omit<this, Where>;
  /** The {@link whereKey} implementation. */
  whereKey(op: Operators, first: KeyOf<Row, Key>, last?: KeyOf<Row, Key>) {
    if (this.#range != null || this.#index != null) {
      throw new SyntaxError('where clause cannot be redefined');
    }

    switch (op) {
      case '=':
        this.#range = IDBKeyRange.only(first);
        return this;
      case '<':
        this.#range = IDBKeyRange.upperBound(first, true);
        return this;
      case '<=':
        this.#range = IDBKeyRange.upperBound(first);
        return this;
      case '>=':
        this.#range = IDBKeyRange.lowerBound(first);
        return this;
      case '>':
        this.#range = IDBKeyRange.lowerBound(first, true);
        return this;
    }

    if (last == null) throw new SyntaxError('Missing upper bounds');

    switch (op) {
      case '[]':
        this.#range = IDBKeyRange.bound(first, last, false, false);
        return this;
      case '(]':
        this.#range = IDBKeyRange.bound(first, last, true, false);
        return this;
      case '()':
        this.#range = IDBKeyRange.bound(first, last, true, true);
        return this;
      case '[)':
        this.#range = IDBKeyRange.bound(first, last, false, true);
        return this;
      default:
        throw new SyntaxError(`Unknown operator ${String(op)}`);
    }
  }
}

/**
 * Put query builder.
 *
 * @todo Add support for whereKey and where with partial data using {@link IDBCursor.update}.
 */
export class UpdateQueryBuilder<Row extends object, Key> {
  /** IndexedDB {@link IDBObjectStore} handle. */
  readonly #handle;

  /** @internal */
  constructor(store: IDBObjectStore) {
    this.#handle = store;
  }

  /** Adds a document to the store. */
  async add(...[document, key]: UpdateArgsFor<Row, Key>) {
    await waitOnRequest(this.#handle.add(document, key));
  }

  /** Adds or updates a document to or in the store. */
  async put(...[document, key]: UpdateArgsFor<Row, Key>) {
    await waitOnRequest(this.#handle.put(document, key));
  }
}

/**
 * Delete query builder.
 *
 * @todo Add support for where, using {@link IDBCursor.delete} from an index.
 */
export class DeleteQueryBuilder<Row extends object, Key> {
  /** IndexedDB {@link IDBObjectStore} handle. */
  readonly #handle;

  /** @internal */
  constructor(store: IDBObjectStore) {
    this.#handle = store;
  }

  /** Deletes everything within the store. */
  async everything() {
    await waitOnRequest(this.#handle.clear());
  }

  /**
   * Deletes all value where the primary key compares with {@link key}.
   * @param op - The comparison operation.
   * @param key - The value with which to compare the primary key.
   * @returns This {@link DeleteQueryBuilder} instance.
   */
  whereKey(op: Compares, key: KeyOf<Row, Key>): Promise<void>;
  /**
   * Deletes all value where the primary key is with the range of  {@link lower}
   * and {@link upper}.
   * @param op - The bounds operation.
   * @param lower - The lower bounds with which to compare the primary key.
   * @param upper - The upper bounds with which to compare the primary key.
   * @returns This {@link DeleteQueryBuilder} instance.
   */
  whereKey(op: Bounds, lower: KeyOf<Row, Key>, upper: KeyOf<Row, Key>): Promise<void>;
  /** The {@link whereKey} implementation. */
  async whereKey(op: Operators, first: KeyOf<Row, Key>, last?: KeyOf<Row, Key>) {
    let range;

    switch (op) {
      case '=':
        range = IDBKeyRange.only(first);
        break;
      case '<':
        range = IDBKeyRange.upperBound(first, true);
        break;
      case '<=':
        range = IDBKeyRange.upperBound(first);
        break;
      case '>=':
        range = IDBKeyRange.lowerBound(first);
        break;
      case '>':
        range = IDBKeyRange.lowerBound(first, true);
        break;
      case '[]':
        if (last == null) throw new SyntaxError('Missing upper bounds');
        range = IDBKeyRange.bound(first, last, false, false);
        break;
      case '(]':
        if (last == null) throw new SyntaxError('Missing upper bounds');
        range = IDBKeyRange.bound(first, last, true, false);
        break;
      case '()':
        if (last == null) throw new SyntaxError('Missing upper bounds');
        range = IDBKeyRange.bound(first, last, true, true);
        break;
      case '[)':
        if (last == null) throw new SyntaxError('Missing upper bounds');
        range = IDBKeyRange.bound(first, last, false, true);
        break;
      default:
        throw new SyntaxError(`Unknown operator ${String(op)}`);
    }

    await waitOnRequest(this.#handle.delete(range));
  }
}

declare global {
  interface IDBObjectStore {
    get<T>(query: IDBValidKey | IDBKeyRange): IDBRequest<T | undefined>;
    getAll<T>(query?: IDBValidKey | IDBKeyRange | null, count?: number): IDBRequest<T[]>;

    getKey<K>(query: IDBValidKey | IDBKeyRange): IDBRequest<K | undefined>;
    getAllKeys<K>(query?: IDBValidKey | IDBKeyRange | null, count?: number): IDBRequest<K[]>;
  }

  interface IDBIndex {
    get<T>(query: IDBValidKey | IDBKeyRange): IDBRequest<T | undefined>;
    getAll<T>(query?: IDBValidKey | IDBKeyRange | null, count?: number): IDBRequest<T[]>;

    getKey<K>(query: IDBValidKey | IDBKeyRange): IDBRequest<K | undefined>;
    getAllKeys<K>(query?: IDBValidKey | IDBKeyRange | null, count?: number): IDBRequest<K[]>;
  }
}
