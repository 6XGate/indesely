---
outline: deep
---

# Query API: Cursor

- **Summary**

  ```ts
  class Cursor<Row, Key, PrimaryKey>
  ```

  Read cursors are used to read a sequence of records that match a given set of queried records. They allow reading the database one record at a time without loading all the records at once. They even provide a means to update or delete the record currently pointed to by the cursor.

  There are key and value cursors. Key cursors only provide access to the key of the record and the key in the index of the record currently being pointed to by the cursor. Values cursors can access the keys as well as the record being pointed to by the cursor.

- **Type Parameters**

  - `Row` — The [type of record](schema#models) in the store being read by the cursor.
  - `Key` — The [key specifications](schema#keys) for the index being read by the cursor, or the primary key if reading from the store.
  - `PrimaryKey` — The [key specifications](schema#keys) for the store being read by the cursor.

## key

- **Summary**

  ```ts
  class Cursor {
    readonly key: Key;
  }
  ```

  Gets the index key, or primary key if not using an index, of the record pointed to by the cursor.

## primaryKey

- **Summary**

  ```ts
  class Cursor {
    readonly primaryKey: PrimaryKey;
  }
  ```

  Gets the primary key of the record pointed to by the cursor.

## value

- **Summary**

  ```ts
  class Cursor {
    readonly value: Row;
  }
  ```

  Gets the record pointed to by the cursor.

  :::warning

  This property is only available on value cursors.

  :::

## advance()

- **Summary**

  ```ts
  class Cursor {
    advance(count: number): void;
  }
  ```

  Advances the cursor a specified number of iteration on the next iteration.

  :::warning

  The effect of this is not immediately executed, you may wait till the next iterator of the iterator that returned the cursor.

  :::

- **Parameters**

  - `count` — The number of iterations to advance the cursor.

## continue()

- **Summary**

  ```ts
  class Cursor {
    continue(key: Key, primaryKey?: PrimaryKey): void;
  }
  ```

  Advances the cursor to the next record with the specified key, and optionally primary key. If the cursor is not using an index, then `key` and `primaryKey` are synonymous.

  :::warning

  The effect of this is not immediately executed, you may wait till the next iterator of the iterator that returned the cursor.

  :::

- **Parameters**

  - `key` — The key of the record to which to advance the cursor.
  - `primaryKey` — The primary key of the record to which to advance the cursor.

## delete()

- **Summary**

  ```ts
  class Cursor {
    delete(): Promise<void>;
  }
  ```

  Deletes the record currently pointed to by the cursor.

  :::warning

  Only available during migration and read/write transactions.

  :::

## update()

- **Summary**

  ```ts
  class Cursor {
    update(record: Row): Promise<Key>;
  }
  ```

  Updates the record currently pointed to by the cursor.

  :::warning

  Only available during migration and read/write transactions.

  :::

- **Parameters**

  - `record` — The record with which to replace the currently pointed to record.

- **Returns**

  The key, or primary key if not using index, of the replacement record.
