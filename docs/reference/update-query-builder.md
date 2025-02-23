---
outline: deep
---

# Query API: UpdateQueryBuilder

- **Summary**

  ```ts
  class UpdateQueryBuilder<Row, Key>
  ```

  Update query

- **Type Parameters**

  - `Row` — The [type of record](schema#models) in the store.
  - `Key` — The [primary key specifications](schema#keys) for the store.

## add()

- **Summary**

  ```ts
  class UpdateQueryBuilder {
    // When the store has a specified or auto-incremented key.
    add(record: Row): Promise<PrimaryKey>;
    // When the store has a manual key.
    add(record: Row, key: IDBValidKey): Promise<PrimaryKey>;
    // When the store in accessed in a migration.
    add(record: Row, key?: IDBValidKey): Promise<PrimaryKey>;
  }
  ```

  Adds a record to the store. Even if the primary key is part of the record or manually specified, it must not be in use by another record.

- **Parameters**

  - `record` — The record to be added to the store.
  - `key` — If required, the key for record.

- **Type Parameters**

  - `PrimaryKey` — The primary key of the new record and those in the store.

- **Returns**

  The primary key of the new record.

## put()

- **Summary**

  ```ts
  class UpdateQueryBuilder {
    // When the store has a specified key.
    put(record: Row): Promise<PrimaryKey>;
    // When the store has an auto-incremented key.
    put(record: Row, key?: number): Promise<PrimaryKey>;
    // When the store has a manual key.
    put(record: Row, key: IDBValidKey): Promise<PrimaryKey>;
    // When the store in accessed in a migration.
    put(record: Row, key?: IDBValidKey): Promise<PrimaryKey>;
  }
  ```

  Adds or replaces a record to the store. Even if the primary key is part of the record or manually specified, the record already using that key will be replaced.

- **Parameters**

  - `record` — The record to be added or replaced to the store.
  - `key` — If required, or optionally, the key for record.

- **Type Parameters**

  - `PrimaryKey` — The primary key of the new or replaced record and those in the store.

- **Returns**

  The primary key of the new record.
