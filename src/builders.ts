import { withResolvers } from './compat.js';
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

/** End of stream indicator. */
type Done = typeof kDone;
/** End of stream indicator. */
const kDone = Symbol('Done');

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

/**
 * Read query builder.
 *
 * @todo Support cursor advancement via keys, which will likely be a different method from {@link stream}.
 */
export class SelectQueryBuilder<Row extends object, Key, Indices extends object> {
  /** IndexedDB {@link IDBObjectStore} handle. */
  readonly #handle;
  /** Select by key range. */
  #range: IDBKeyRange | null = null;
  /** Select by index range. */
  #index: [name: keyof Indices, range: IDBKeyRange] | null = null;
  /** Selection limit. */
  #limit: number | undefined;

  constructor(store: IDBObjectStore) {
    this.#handle = store;
  }

  /** Gets the number of documents that matches the query. */
  async count() {
    if (this.#limit != null) {
      throw new SyntaxError('Cannot count when limit is set');
    }

    if (this.#range != null) {
      return await waitOnRequest(this.#handle.count(this.#range));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.#handle.index(String(name)).count(range));
    }

    return await waitOnRequest(this.#handle.count());
  }

  /** Creates a new asynchronous iterator, based on the current query. */
  [Symbol.asyncIterator]() {
    return this.stream();
  }

  /** Streams all documents that match the query via an asynchronous iterator. */
  async *stream(): AsyncGenerator<Row, void, number | undefined> {
    let limit = this.#limit;

    let request;
    if (this.#range != null) {
      request = this.#handle.openCursor(this.#range);
    } else if (this.#index != null) {
      const [name, range] = this.#index;
      request = this.#handle.index(String(name)).openCursor(range);
    } else {
      request = this.#handle.openCursor();
    }

    let { promise, resolve, reject } = withResolvers<Row | Done>();

    request.onerror = () => {
      reject(request.error ?? new Error('Unknown cursor error'));
    };

    let advancement: number | undefined;
    request.onsuccess = () => {
      if (limit === 0) {
        resolve(kDone);
        return;
      } else if (limit != null) {
        limit -= 1;
      }

      const cursor = request.result;
      if (cursor == null) {
        resolve(kDone);
        return;
      }

      resolve((cursor.value ?? kDone) as Row | Done);
      ({ promise, resolve, reject } = withResolvers<Row | Done>());

      if (advancement) cursor.advance(advancement);
      else cursor.continue();
    };

    let row: Row | Done;
    while ((row = await promise) !== kDone) {
      advancement = yield row;
    }
  }

  /** Gets the documents that match the query. */
  async getAll() {
    if (this.#limit === 0) return [];

    if (this.#range != null) {
      return await waitOnRequest(this.#handle.getAll<Row>(this.#range, this.#limit));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.#handle.index(String(name)).getAll<Row>(range, this.#limit));
    }

    return await waitOnRequest(this.#handle.getAll<Row>(null, this.#limit));
  }

  /** Gets the first document that matches the query, or `null` if none matches. */
  async getFirst() {
    if (this.#limit === 0) return undefined;

    if (this.#range != null) {
      return await waitOnRequest(this.#handle.get<Row>(this.#range));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.#handle.index(String(name)).get<Row>(range));
    }

    // TODO: Use cursor to support this? May not be useful.
    // return await waitOnRequest<Row>(this.#handle.get());
    throw new SyntaxError('Missing where clause');
  }

  /**
   * Gets the first document that matches the query, or throws if none matches.
   * @param error - Optional error constructor or factory.
   */
  async getFirstOrThrow(error?: typeof Error | (() => Error)) {
    let result;
    if (this.#limit === 0) {
      throw new Error('No document not found');
    } else if (this.#range != null) {
      result = await waitOnRequest<Row | undefined>(this.#handle.get(this.#range));
    } else if (this.#index != null) {
      const [name, range] = this.#index;
      result = await waitOnRequest<Row | undefined>(this.#handle.index(String(name)).get(range));
    } else {
      // TODO: Use cursor to support this? May not be useful.
      // return await waitOnRequest<Row>(this.#handle.get());
      throw new SyntaxError('Missing where clause');
    }

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

  /** Streams all primary keys for documents that match the query via an asynchronous iterator. */
  async *streamKeys(): AsyncGenerator<MemberType<Row, Key>, void, number | undefined> {
    type PK = MemberType<Row, Key>;

    let limit = this.#limit;

    let request;
    if (this.#range != null) {
      request = this.#handle.openKeyCursor(this.#range);
    } else if (this.#index != null) {
      const [name, range] = this.#index;
      request = this.#handle.index(String(name)).openKeyCursor(range);
    } else {
      request = this.#handle.openKeyCursor();
    }

    let { promise, resolve, reject } = withResolvers<PK | Done>();

    request.onerror = () => {
      reject(request.error ?? new Error('Unknown key cursor error'));
    };

    let advancement: number | undefined;
    request.onsuccess = () => {
      if (limit === 0) {
        resolve(kDone);
        return;
      } else if (limit != null) {
        limit -= 1;
      }

      const cursor = request.result;
      if (cursor == null) {
        resolve(kDone);
        return;
      }

      resolve(cursor.primaryKey as PK);
      ({ promise, resolve, reject } = withResolvers<PK | Done>());

      if (advancement) cursor.advance(advancement);
      else cursor.continue();
    };

    let row;
    while ((row = await promise) !== kDone) {
      advancement = yield row;
    }
  }

  /** Gets the primary keys for documents that match the query. */
  async getAllKeys() {
    type PK = MemberType<Row, Key>;

    if (this.#limit === 0) return [];

    if (this.#range != null) {
      return await waitOnRequest(this.#handle.getAllKeys<PK>(this.#range, this.#limit));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.#handle.index(String(name)).getAllKeys<PK>(range, this.#limit));
    }

    return await waitOnRequest(this.#handle.getAllKeys<PK>(null, this.#limit));
  }

  /** Gets the primary key for the first document that matches the query, or `null` if none matches. */
  async getFirstKey() {
    type PK = MemberType<Row, Key>;

    if (this.#limit === 0) return undefined;

    if (this.#range != null) {
      return await waitOnRequest(this.#handle.getKey<PK>(this.#range));
    }

    if (this.#index != null) {
      const [name, range] = this.#index;
      return await waitOnRequest(this.#handle.index(String(name)).getKey<PK>(range));
    }

    // TODO: Use cursor to support this? May not be useful.
    // return await waitOnRequest<Row>(this.#handle.get());
    throw new SyntaxError('Missing where clause');
  }

  /**
   * Gets the primary key for the first document that matches the query, or throws if none matches.
   * @param error - Optional error constructor or factory.
   */
  async getFirstKeyOrThrow(error?: typeof Error | (() => Error)) {
    type PK = MemberType<Row, Key>;

    let result;
    if (this.#limit === 0) {
      throw new Error('No document not found');
    } else if (this.#range != null) {
      result = await waitOnRequest(this.#handle.getKey<PK>(this.#range));
    } else if (this.#index != null) {
      const [name, range] = this.#index;
      result = await waitOnRequest(this.#handle.index(String(name)).getKey<PK>(range));
    } else {
      // TODO: Use cursor to support this? May not be useful.
      // return await waitOnRequest<Row>(this.#handle.get());
      throw new SyntaxError('Missing where clause');
    }

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
  ): Omit<this, Where>;
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
  ): Omit<this, Where>;
  /** The {@link where} implementation. */
  where<Index extends keyof Indices>(
    index: Index,
    op: Operators,
    first: MemberType<Row, Indices[Index]>,
    last?: MemberType<Row, Indices[Index]>,
  ): Omit<this, Where> {
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
  whereKey(op: Operators, first: KeyOf<Row, Key>, last?: KeyOf<Row, Key>): Omit<this, Where> {
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

  /**
   * Adds a limit clause.
   * @param count - The maximum number of documents to limit the query.
   * @returns This {@link SelectQueryBuilder} instance.
   */
  limit(count: number) {
    if (this.#limit != null) {
      throw new SyntaxError('limit cannot be redefined');
    }

    this.#limit = count;

    return this as Omit<this, 'limit'>;
  }
}

/** Add query builder. */
export class InsertQueryBuilder<Row extends object, Key> {
  /** IndexedDB {@link IDBObjectStore} handle. */
  readonly #handle;

  constructor(store: IDBObjectStore) {
    this.#handle = store;
  }

  /** Adds a document to the store. */
  async add(...[document, key]: UpdateArgsFor<Row, Key>) {
    await waitOnRequest(this.#handle.add(document, key));
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

  constructor(store: IDBObjectStore) {
    this.#handle = store;
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
  /** Delete by key range. */
  #range: IDBKeyRange | null = null;

  constructor(store: IDBObjectStore) {
    this.#handle = store;
  }

  /** Deletes all documents matching the query. */
  async delete() {
    if (this.#range != null) {
      await waitOnRequest(this.#handle.delete(this.#range));
    } else {
      await waitOnRequest(this.#handle.clear());
    }
  }

  /**
   * Adds a where clause to the query to compare the primary key with a value.
   * @param op - The comparison operation.
   * @param value - The value with which to compare the primary key.
   * @returns This {@link DeleteQueryBuilder} instance.
   */
  whereKey(op: Compares, value: KeyOf<Row, Key>): Omit<this, Where>;
  /**
   * Adds a where clause to the query to compares the primary key with a bounds.
   * @param op - The bounds operation.
   * @param lower - The lower bounds with which to compare the primary key.
   * @param upper - The upper bounds with which to compare the primary key.
   * @returns This {@link DeleteQueryBuilder} instance.
   */
  whereKey(op: Bounds, lower: KeyOf<Row, Key>, upper: KeyOf<Row, Key>): Omit<this, Where>;
  /** The {@link whereKey} implementation. */
  whereKey(op: Operators, first: KeyOf<Row, Key>, last?: KeyOf<Row, Key>): Omit<this, Where> {
    if (this.#range != null) {
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
