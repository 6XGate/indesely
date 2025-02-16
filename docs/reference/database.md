---
outline: deep
---

# Database API: Database

## useDatabase()

- **Summary**

  ```ts
  type DatabaseFactory = () => Database;
  const useDatabase: DatabaseFactory;
  ```

  Creates a connection to a database. The name of these functions defined by the caller of [`defineDatabase`](management#definedatabase).

- **Returns**

  Returns a Database handle use to interact with the database.

## getName()

- **Summary**

  ```ts
  db.getName(): Promise<string>;
  ```

  Gets the database name.

## getVersion()

- **Summary**

  ```ts
  db.getVersion(): Promise<number>;
  ```

  Gets the database version. With Indesely, the version is used as a means to track which migrations have been run on the database.

## getStores()

- **Summary**

  ```ts
  db.getStores(): Promise<string[]>;
  ```

  Gets the name of all the object stores.

## read()

- **Summary**

  ```ts
  db.read<Stores, Result>(stores: Stores[], scope: (trx: Transaction) => Promise<Result>): Promise<Result>;
  ```

  Starts a read-only transaction.

- **Parameters**

  - `stores` — The names of the stores to utilize in the transaction.
  - `scope` — Callback that will perform database operations.
    - `trx` — The [Transaction](transaction) to use.

- **Type Parameters**

  - `Stores` — The stores from which to read.
  - `Result` — The result returned from `scope`.

- **Returns**

  The result of the callback function.

## change()

- **Summary**

  ```ts
  db.change<Stores, Result>(stores: Stores[], scope: (trx: Transaction) => Promise<Result>): Promise<Result>;
  ```

  Starts a read-write transaction.

- **Parameters**

  - `stores` — The names of the stores to utilize in the transaction.
  - `scope` — Callback that will perform database operations.
    - `trx` — The [Transaction](transaction) to use.

- **Type Parameters**

  - `Stores` — The stores from which to modify.
  - `Result` — The result returned from `scope`.

- **Returns**

  The result of the callback function.
