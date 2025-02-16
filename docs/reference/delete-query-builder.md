---
outline: deep
---

# Query API: DeleteQueryBuilder

- **Summary**

  ```ts
  class DeleteQueryBuilder<Row, Key>
  ```

  Deletion query builder.

- **Type Parameters**

  - `Row` — The [type of record](schema#models) in the store.
  - `Key` — The [primary key specifications](schema#keys) for the store.

## everything()

- **Summary**

  ```ts
  builder.everything(): Promise<void>
  ```

  Deletes everything in the store.

## whereKey()

- **Summary**

  ```ts
  builder.whereKey(op: Compares, key: PrimaryKey): Promise<void>;
  builder.whereKey(op: Bounds, lower: PrimaryKey, upper: PrimaryKey): Promise<void>;
  ```

  Deletes only records that match those compared with the given key or bounds.

- **Parameters**

  - `op` — The [operator](where-operators) with which to the compare the specified values with the record keys.
  - `key` — The value with which to compare the primary keys of the records in the store.
  - `lower` — The lower bounds with which to compare the primary keys of the records in the store.
  - `upper` — The upper bounds with which to compare the primary keys of the records in the store.

- **Type Parameters**

  - `PrimaryKey` — The primary keys of the records in the store.
