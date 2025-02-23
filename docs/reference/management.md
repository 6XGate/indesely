---
outline: deep
---

# Database API: Management

## listDatabases()

- **Summary**

  ```ts
  function listDatabases(): Promise<string[]>;
  ```

  Gets a list of all databases.

## dropDatabase()

- **Summary**

  ```ts
  function dropDatabase(name: string): Promise<void>;
  ```

  Attempts to delete a database.

- **Parameters**

  - `name` — The name of the database to delete.

## defineDatabase()

- **Summary**

  ```ts
  function defineDatabase<Schema>(options: DefineDatabaseOptions): DatabaseFactory;
  ```

  Defines a database.

- **Parameters**

  - `options` — The database definition options.
    - `name` — The name of the database.
    - `migrations` — An array of [Migration](migrations#migration) function.
    - `persist` — Request that the user agent persist the database, even under [storage pressure](https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#when_is_data_evicted).

- **Type Parameters**

  - `Schema` — The definition of the [object store schemas](schema).

- **Returns**

  Returns a [factory](database#usedatabase) to create a connection to the [Database](database).
