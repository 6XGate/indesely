import { KeyCursor, ValueCursor } from './cursor.js';
import { ObjectStore } from './schema.js';
import { isClass, waitOnRequest } from './utilities.js';
import type { AutoIncrement, KeyOf, ManualKey, MemberPaths, MemberType, UpgradingKey } from './schema.js';

/** Comparison operators of the where clause. */
type Compares = '=' | '<' | '<=' | '>=' | '>';
/** Bounds operators of the where clause. */
type Bounds = '[]' | '()' | '(]' | '[)';
/** Operators of the where clause. */
type Operators = Compares | Bounds;

/** Where clause functions, use to exclude them from the builder when once called. */
type Where = 'whereKey' | 'where';

/** Gets the necessary _add_ and _put_ parameters for a row. */
export type UpdateArgsFor<Row extends object, Key> = Key extends AutoIncrement
  ? [record: Row]
  : Key extends ManualKey<infer K>
    ? [record: Row, key: K]
    : Key extends UpgradingKey
      ? [record: Row, key?: IDBValidKey]
      : Key extends MemberPaths<Row>[]
        ? [record: Row]
        : Key extends MemberPaths<Row>
          ? [record: Row]
          : never;

async function waitForRow<Row>(request: IDBRequest<Row | undefined>) {
  const row = await waitOnRequest(request);
  return row ?? null;
}

type ErrorFactory = (...args: ConstructorParameters<typeof Error>) => Error;
type ErrorSource = typeof Error | ErrorFactory;

/**
 * Selection query builder options.
 * @internal
 */
interface SelectQueryOptions<Indices> {
  store: IDBObjectStore;
  range?: IDBKeyRange | null | undefined;
  index?: [name: keyof Indices, range: IDBKeyRange] | null | undefined;
}

/** Read query builder. */
export class SelectQueryBuilder<Row extends object, Key, Indices extends object, CursorKey = Key> extends ObjectStore {
  /** Select by key range. */
  #range;
  /** Select by index range. */
  #index;

  /** @internal */
  constructor({ store, range = null, index = null }: SelectQueryOptions<Indices>) {
    super(store);
    this.#range = range;
    this.#index = index;
  }

  /** Gets the number of records that matches the query. */
  async count() {
    if (this.#range != null) {
      return await waitOnRequest(this.handle.count(this.#range));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.handle.index(String(name)).count(range));
    }

    return await waitOnRequest(this.handle.count());
  }

  /**
   * Iterator a cursor for all records that match the query via an asynchronous iterator.
   * @param direction - The direction to stream the primary keys.
   */
  async *cursor(direction?: IDBCursorDirection) {
    let request;
    if (this.#index != null) {
      const [name, range] = this.#index;
      request = this.handle.index(String(name)).openCursor(range, direction);
    } else {
      request = this.handle.openCursor(this.#range, direction);
    }

    const cursor = new ValueCursor<Row, KeyOf<Row, CursorKey>, KeyOf<Row, Key>>(request);

    yield* cursor;
  }

  /**
   * Iterator a key cursor for all records that match the query via an asynchronous iterator.
   * @param direction - The direction to stream the primary keys.
   */
  async *keyCursor(direction?: IDBCursorDirection) {
    let request;
    if (this.#index != null) {
      const [name, range] = this.#index;
      request = this.handle.index(String(name)).openKeyCursor(range, direction);
    } else {
      request = this.handle.openKeyCursor(this.#range, direction);
    }

    const cursor = new KeyCursor<Row, KeyOf<Row, CursorKey>, KeyOf<Row, Key>>(request);

    yield* cursor;
  }

  /** Creates a new asynchronous iterator, based on the current query. */
  [Symbol.asyncIterator]() {
    return this.stream();
  }

  /**
   * Streams all records that match the query via an asynchronous iterator.
   * @param direction - The direction to stream the primary keys.
   */
  async *stream(direction?: IDBCursorDirection): AsyncGenerator<Row, void, number | undefined> {
    for await (const cursor of this.cursor(direction)) {
      const advance = yield cursor.value;
      if (advance != null) cursor.advance(advance);
    }
  }

  /**
   * Streams all keys for records that match the query via an asynchronous iterator.
   * @param direction - The direction to stream the primary keys.
   */
  async *streamKeys(direction?: IDBCursorDirection): AsyncGenerator<KeyOf<Row, CursorKey>, void, number | undefined> {
    for await (const cursor of this.cursor(direction)) {
      const advance = yield cursor.key;
      if (advance != null) cursor.advance(advance);
    }
  }

  /**
   * Streams all primary keys for records that match the query via an asynchronous iterator.
   * @param direction - The direction to stream the primary keys.
   */
  async *streamPrimaryKeys(direction?: IDBCursorDirection): AsyncGenerator<KeyOf<Row, Key>, void, number | undefined> {
    for await (const cursor of this.cursor(direction)) {
      const advance = yield cursor.primaryKey;
      if (advance != null) cursor.advance(advance);
    }
  }

  /**
   * Gets the records that match the query.
   * @param count - The maximum number of record to retrieve if specified.
   */
  async getAll(count?: number) {
    if (this.#range != null) {
      return await waitOnRequest(this.handle.getAll<Row>(this.#range, count));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.handle.index(String(name)).getAll<Row>(range, count));
    }

    return await waitOnRequest(this.handle.getAll<Row>(null, count));
  }

  /** Gets the first record that matches the query, or `null` if none matches. */
  async getFirst() {
    if (this.#range != null) {
      return await waitForRow(this.handle.get<Row>(this.#range));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitForRow(this.handle.index(String(name)).get<Row>(range));
    }

    throw new SyntaxError('Missing where clause');
  }

  /**
   * Gets the first record that matches the query, or throws if none matches.
   * @param error - Optional error constructor or factory.
   */
  async getFirstOrThrow(error?: ErrorSource) {
    const result = await this.getFirst();
    if (result != null) {
      return result;
    }

    if (error == null) {
      // }  typeof error !== 'function') {
      throw new Error('No record found');
    }

    if (isClass<Error>(error)) {
      throw new error('No record found');
    }

    throw error('No record found');
  }

  /**
   * Gets the primary keys for records that match the query.
   * @param count - The maximum number of keys to retrieve if specified.
   */
  async getAllKeys(count?: number) {
    type PK = KeyOf<Row, Key>;

    if (this.#range != null) {
      return await waitOnRequest(this.handle.getAllKeys<PK>(this.#range, count));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.handle.index(String(name)).getAllKeys<PK>(range, count));
    }

    return await waitOnRequest(this.handle.getAllKeys<PK>(null, count));
  }

  /** Gets the primary key for the first record that matches the query, or `null` if none matches. */
  async getFirstKey() {
    type PK = KeyOf<Row, Key>;

    if (this.#range != null) {
      return await waitOnRequest(this.handle.getKey<PK>(this.#range));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.handle.index(String(name)).getKey<PK>(range));
    }

    throw new SyntaxError('Missing where clause');
  }

  /**
   * Gets the primary key for the first record that matches the query, or throws if none matches.
   * @param error - Optional error constructor or factory.
   */
  async getFirstKeyOrThrow(error?: ErrorSource) {
    const key = await this.getFirstKey();
    if (key != null) {
      return key;
    }

    if (typeof error !== 'function') {
      throw new Error('No record found');
    }

    if (isClass<Error>(error)) {
      throw new error('No record found');
    }

    throw error('No record found');
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
    name: Index,
    op: Operators,
    first: MemberType<Row, Indices[Index]>,
    last?: MemberType<Row, Indices[Index]>,
  ) {
    if (this.#range != null || this.#index != null) {
      throw new SyntaxError('where clause cannot be redefined');
    }

    const store = this.handle;
    let index: [Index, IDBKeyRange];
    switch (op) {
      case '=':
        index = [name, IDBKeyRange.only(first)];
        return new SelectQueryBuilder<Row, Key, Indices, Indices[Index]>({ store, index });
      case '<':
        index = [name, IDBKeyRange.upperBound(first, true)];
        return new SelectQueryBuilder<Row, Key, Indices, Indices[Index]>({ store, index });
      case '<=':
        index = [name, IDBKeyRange.upperBound(first)];
        return new SelectQueryBuilder<Row, Key, Indices, Indices[Index]>({ store, index });
      case '>=':
        index = [name, IDBKeyRange.lowerBound(first)];
        return new SelectQueryBuilder<Row, Key, Indices, Indices[Index]>({ store, index });
      case '>':
        index = [name, IDBKeyRange.lowerBound(first, true)];
        return new SelectQueryBuilder<Row, Key, Indices, Indices[Index]>({ store, index });
    }

    if (last == null) throw new SyntaxError(`Missing upper bounds for "${op}" operator`);

    switch (op) {
      case '[]':
        index = [name, IDBKeyRange.bound(first, last, false, false)];
        return new SelectQueryBuilder<Row, Key, Indices, Indices[Index]>({ store, index });
      case '(]':
        index = [name, IDBKeyRange.bound(first, last, true, false)];
        return new SelectQueryBuilder<Row, Key, Indices, Indices[Index]>({ store, index });
      case '()':
        index = [name, IDBKeyRange.bound(first, last, true, true)];
        return new SelectQueryBuilder<Row, Key, Indices, Indices[Index]>({ store, index });
      case '[)':
        index = [name, IDBKeyRange.bound(first, last, false, true)];
        return new SelectQueryBuilder<Row, Key, Indices, Indices[Index]>({ store, index });
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
  whereKey(op: Compares, value: KeyOf<Row, Key>): Omit<SelectQueryBuilder<Row, Key, Indices>, Where>;
  /**
   * Adds a where clause to the query to compares the primary key with a bounds.
   * @param op - The bounds operation.
   * @param lower - The lower bounds with which to compare the primary key.
   * @param upper - The upper bounds with which to compare the primary key.
   * @returns This {@link SelectQueryBuilder} instance.
   */
  whereKey(
    op: Bounds,
    lower: KeyOf<Row, Key>,
    upper: KeyOf<Row, Key>,
  ): Omit<SelectQueryBuilder<Row, Key, Indices>, Where>;
  /** The {@link whereKey} implementation. */
  whereKey(op: Operators, first: KeyOf<Row, Key>, last?: KeyOf<Row, Key>) {
    if (this.#range != null || this.#index != null) {
      throw new SyntaxError('where clause cannot be redefined');
    }

    const store = this.handle;
    let range: IDBKeyRange;
    switch (op) {
      case '=':
        range = IDBKeyRange.only(first);
        return new SelectQueryBuilder<Row, Key, Indices>({ store, range });
      case '<':
        range = IDBKeyRange.upperBound(first, true);
        return new SelectQueryBuilder<Row, Key, Indices>({ store, range });
      case '<=':
        range = IDBKeyRange.upperBound(first);
        return new SelectQueryBuilder<Row, Key, Indices>({ store, range });
      case '>=':
        range = IDBKeyRange.lowerBound(first);
        return new SelectQueryBuilder<Row, Key, Indices>({ store, range });
      case '>':
        range = IDBKeyRange.lowerBound(first, true);
        return new SelectQueryBuilder<Row, Key, Indices>({ store, range });
    }

    if (last == null) throw new SyntaxError('Missing upper bounds');

    switch (op) {
      case '[]':
        range = IDBKeyRange.bound(first, last, false, false);
        return new SelectQueryBuilder<Row, Key, Indices>({ store, range });
      case '(]':
        range = IDBKeyRange.bound(first, last, true, false);
        return new SelectQueryBuilder<Row, Key, Indices>({ store, range });
      case '()':
        range = IDBKeyRange.bound(first, last, true, true);
        return new SelectQueryBuilder<Row, Key, Indices>({ store, range });
      case '[)':
        range = IDBKeyRange.bound(first, last, false, true);
        return new SelectQueryBuilder<Row, Key, Indices>({ store, range });
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
export class UpdateQueryBuilder<Row extends object, Key> extends ObjectStore {
  /** Adds a record to the store. */
  async add(...[record, key]: UpdateArgsFor<Row, Key>) {
    const result = await waitOnRequest(this.handle.add(record, key));
    return result as KeyOf<Row, Key>;
  }

  /** Adds or updates a record to or in the store. */
  async put(...[record, key]: UpdateArgsFor<Row, Key>) {
    const result = await waitOnRequest(this.handle.put(record, key));
    return result as KeyOf<Row, Key>;
  }
}

/**
 * Delete query builder.
 *
 * @todo Add support for where, using {@link IDBCursor.delete} from an index.
 */
export class DeleteQueryBuilder<Row extends object, Key> extends ObjectStore {
  /** Deletes everything within the store. */
  async everything() {
    await waitOnRequest(this.handle.clear());
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
        await waitOnRequest(this.handle.delete(range));
        return;
      case '<':
        range = IDBKeyRange.upperBound(first, true);
        await waitOnRequest(this.handle.delete(range));
        return;
      case '<=':
        range = IDBKeyRange.upperBound(first);
        await waitOnRequest(this.handle.delete(range));
        return;
      case '>=':
        range = IDBKeyRange.lowerBound(first);
        await waitOnRequest(this.handle.delete(range));
        return;
      case '>':
        range = IDBKeyRange.lowerBound(first, true);
        await waitOnRequest(this.handle.delete(range));
        return;
    }

    if (last == null) throw new SyntaxError('Missing upper bounds');

    switch (op) {
      case '[]':
        range = IDBKeyRange.bound(first, last, false, false);
        await waitOnRequest(this.handle.delete(range));
        return;
      case '(]':
        range = IDBKeyRange.bound(first, last, true, false);
        await waitOnRequest(this.handle.delete(range));
        return;
      case '()':
        range = IDBKeyRange.bound(first, last, true, true);
        await waitOnRequest(this.handle.delete(range));
        return;
      case '[)':
        range = IDBKeyRange.bound(first, last, false, true);
        await waitOnRequest(this.handle.delete(range));
        return;
      default:
        throw new SyntaxError(`Unknown operator ${String(op)}`);
    }
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
