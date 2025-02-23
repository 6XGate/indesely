---
outline: deep
---

# Query API: SelectQueryBuilder

- **Summary**

  ```ts
  class SelectQueryBuilder<Row, Key, Indices, CursorKey = Key>
  ```

  Selection query

- **Type Parameters**

  - `Row` — The [type of record](schema#models) in the store.
  - `Key` — The [primary key specifications](schema#keys) for the store.
  - `Indices` — The [index specifications](schema#indices) for the store.
  - `CursorKey` — The key specification for the key that will be return by cursors.

## count()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    count(): Promise<number>;
  }
  ```

  Gets the number of records that matches the query.

## by()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    by<Index>(index: Index): SelectQueryBuilder<Row, Key, Indices, Indices[Index]>;
  }
  ```

  Adds a clause to the builder to get and sort records by an index. May not be combine with the [`where`](#where) or [`whereKey`](#wherekey) clause.

- **Parameters**

  - `index` — The index on which to index and sort the query, as well as the index from which keys on cursors will be sourced.

- **Type Parameters**

  - `Index` — The index on which to sort the query, as well as the index from which keys on cursors will be sourced.

## cursor()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    cursor(direction?: IDBCursorDirection): AsyncGenerator<Cursor<Row, CursorKey, PrimaryKey>>;
  }
  ```

  Gets an iterator for a cursor to read and update records in the store that matches the query.

- **Parameters**

  - `direction` — The direction the cursor should iterate.

- **Type Parameters**

  - `CursorKey` — The key from the index, or the primary key, the cursor was referencing.
  - `PrimaryKey` — The primary key of the store.

## keyCursor()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    keyCursor(direction?: IDBCursorDirection): AsyncGenerator<Cursor<Row, CursorKey, PrimaryKey>>;
  }
  ```

  Gets an iterator for a cursor to read keys and update the records they reference in the store that matches the query.

- **Parameters**

  - `direction` — The direction the cursor should iterate.

- **Type Parameters**

  - `CursorKey` — The key from the index, or the primary key, the cursor was referencing.
  - `PrimaryKey` — The primary key of the store.

## \[Symbol.asyncIterator\]()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    [Symbol.asyncIterator](): AsyncGenerator<Row, void, number | undefined>;
  }
  ```

  Gets an iterator to read records in the store that match the query. Pass a number to the `iterator.next` call will advance the cursor that number of iterations.

## stream()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    stream(direction?: IDBCursorDirection): AsyncGenerator<Row, void, number | undefined>;
  }
  ```

  Gets an iterator to read records in the store that match the query. Pass a number to the `iterator.next` call will advance the cursor that number of iterations.

- **Parameters**

  - `direction` — The direction the cursor should iterate.

## streamKeys()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    streamKeys(direction?: IDBCursorDirection): AsyncGenerator<CursorKey, void, number | undefined>;
  }
  ```

  Gets an iterator to read key in the index that match the query. Pass a number to the `iterator.next` call will advance the cursor that number of iterations.

- **Parameters**

  - `direction` — The direction the cursor should iterate.

- **Type Parameters**

  - `CursorKey` — The key from the index, or the primary key, the cursor was referencing.

## streamPrimaryKeys()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    streamPrimaryKeys(direction?: IDBCursorDirection): AsyncGenerator<PrimaryKey, void, number | undefined>;
  }
  ```

  Gets an iterator to read the primary keys in the store that match the query. Pass a number to the `iterator.next` call will advance the cursor that number of iterations.

- **Parameters**

  - `direction` — The direction the cursor should iterate.

- **Type Parameters**

  - `PrimaryKey` — The primary key of the store.

## getAll()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    getAll(count?: number): Promise<Row[]>;
  }
  ```

  Gets all, or the specified number, of records that match the query.

- **Parameters**

  - `count` — The maximum number of records to retrieve, or all if not specified.

- **Returns**

  An array containing all, or at most the specified number, of records that match the query.

## getFirst()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    getFirst(): Promise<Row | null>;
  }
  ```

  Gets the first record to match the query, if present. A [`where`](#where) or [`whereKey`](#wherekey) call must be made to use this operation.

- **Returns**

  The first record that match the query, or `null` if none does.

## getFirstOrThrow()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    getFirstOrThrow(error?: ErrorFactory): Promise<Row>;
  }
  ```

  Gets the first record to match the query, or throw an error if none exists. A [`where`](#where) or [`whereKey`](#wherekey) call must be made to use this operation.

-
- **Type Parameters**

  - `ErrorFactory` — The `Error` compatible constructor of a specific class of error to throw, or a factory that will create the error to throw, if no matching record exists.

- **Returns**

  The first record that match the query.

## getAllKeys()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    getAllKeys(count?: number): Promise<PrimaryKey[]>;
  }
  ```

  Gets all, or the specified number, of primary keys that match the query.

- **Parameters**

  - `count` — The maximum number of keys to retrieve, or all if not specified.

- **Returns**

  An array containing all, or at most the specified number, of keys that match the query.

## getFirstKey()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    getFirstKey(): Promise<PrimaryKey | undefined>;
  }
  ```

  Gets the first primary key that matches the query, if present. A [`where`](#where) or [`whereKey`](#wherekey) call must be made to use this operation.

- **Returns**

  The first key that match the query, or `undefined` if none does.

## getFirstKeyOrThrow()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    getFirstKeyOrThrow(error?: ErrorFactory): Promise<PrimaryKey | undefined>;
  }
  ```

  Gets the first primary key that matches the query, or throw an error if none exists. A [`where`](#where) or [`whereKey`](#wherekey) call must be made to use this operation.

-
- **Type Parameters**

  - `ErrorFactory` — The `Error` compatible constructor of a specific class of error to throw, or a factory that will create the error to throw, if no matching key exists.

- **Returns**

  The first key that match the query.

## where()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    where<Index>(index: Index, op: Compares, key: IndexKey): SelectQueryBuilder<Row, Key, Indices, Indices[Index]>;
    where<Index>(index: Index, op: Bounds, lower: IndexKey, upper: IndexKey): SelectQueryBuilder<Row, Key, Indices, Indices[Index]>;
  }
  ```

  Adds a where clause, known as a constraint, to the query using the specified index. Also specified by which index records will be sorted. Only one such constraint may exist at a time on a query. May not be combine with the [`by`](#by) clause.

- **Parameters**

  - `index` — The index on which to constrain the query, as well as the index from which keys on cursors will be sourced.
  - `op` — The [operator](where-operators) with which to the compare the specified values with the record keys.
  - `key` — The value with which to compare the primary keys of the records in the store.
  - `lower` — The lower bounds with which to compare the primary keys of the records in the store.
  - `upper` — The upper bounds with which to compare the primary keys of the records in the store.

- **Type Parameters**

  - `Index` — The index on which to constrain the query, as well as the index from which keys on cursors will be sourced.
  - `IndexKey` — The index's key type.

- **Returns**

  A new query builder with the applied constraint.

## whereKey()

- **Summary**

  ```ts
  class SelectQueryBuilder {
    whereKey(op: Compares, key: PrimaryKey): SelectQueryBuilder<Row, Key, Indices>;
    whereKey(op: Bounds, lower: IndexKey, upper: PrimaryKey): SelectQueryBuilder<Row, Key, Indices>;
  }
  ```

  Adds a where clause, known as a constraint, to the query using the primary key. Only one such constraint may exist at a time on a query. May not be combine with the [`by`](#by) clause.

- **Parameters**

  - `op` — The [operator](where-operators) with which to the compare the specified values with the record keys.
  - `key` — The value with which to compare the primary keys of the records in the store.
  - `lower` — The lower bounds with which to compare the primary keys of the records in the store.
  - `upper` — The upper bounds with which to compare the primary keys of the records in the store.

- **Type Parameters**

  - `PrimaryKey` — The primary key of the store.

- **Returns**

  A new query builder with the applied constraint.
