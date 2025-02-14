---
outline: deep
---

# Database API: Database

## useDatabase()

- **Summary**

  ```ts
  type DatabaseFactory = () => Database;
  ```

  Creates a connection to a database.

## getName()

- **Summary**

  ```ts
  getName(): Promise<string>;
  ```

  Gets the database name.

## getVersion()

- **Summary**

  ```ts
  getVersion(): Promise<number>;
  ```

  Gets the database version.

## getStores()

- **Summary**

  ```ts
  getStores(): Promise<string[]>;
  ```

  Gets the name of all the object stores.

## read()

- **Summary**

  ```ts
  read<Stores, Result>(stores: Stores[], scope: (trx: Transaction) => Promise<Result>): Promise<Result>;
  ```

  Starts a read-only transaction.

- **Parameters**

  - `stores` — The names of the stores to utilize in the transaction.
  - `scope` — Callback that will perform database operations.
    - `trx` — The [transaction](transaction) to use.

- **Returns**

  The result of the callback function.

## change()

- **Summary**

  ```ts
  change<Stores, Result>(stores: Stores[], scope: (trx: Transaction) => Promise<Result>): Promise<Result>;
  ```

  Starts a read-write transaction.

- **Parameters**

  - `stores` — The names of the stores to utilize in the transaction.
  - `scope` — Callback that will perform database operations.
    - `trx` — The [transaction](transaction) to use.

- **Returns**

  The result of the callback function.
