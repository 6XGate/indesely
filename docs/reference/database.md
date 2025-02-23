---
outline: deep
---

# Database API: Database

- **Summary**

  ```ts
  interface Database<Schema>;
  ```

  The interface for a database connection contains the necessary methods to get information about a database as well as start transactions on it. You get an instance of a database by using the `useDatabase` factory mentioned below that is return from [`defineDatabase`](management#definedatabase).

## useDatabase()

- **Summary**

  ```ts
  type DatabaseFactory = () => Database<Schema>;
  const useDatabase: DatabaseFactory;
  ```

  Creates a connection to a database. The name of these functions defined by the caller of [`defineDatabase`](management#definedatabase).

- **Returns**

  Returns a Database handle use to interact with the database.

## getName()

- **Summary**

  ```ts
  interface Database {
    getName(): Promise<string>;
  }
  ```

  Gets the database name.

## getVersion()

- **Summary**

  ```ts
  interface Database {
    getVersion(): Promise<number>;
  }
  ```

  Gets the database version. With Indesely, the version is used as a means to track which migrations have been run on the database.

## getStores()

- **Summary**

  ```ts
  interface Database {
    getStores(): Promise<string[]>;
  }
  ```

  Gets the name of all the object stores.

## read()

- **Summary**

  ```ts
  interface Database {
    read<Stores, Result>(stores: Stores[], scope: (trx: Transaction) => Promise<Result>): Promise<Result>;
  }
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
  interface Database {
    change<Stores, Result>(stores: Stores[], scope: (trx: Transaction) => Promise<Result>): Promise<Result>;
  }
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

## close()

- **Summary**

  ```ts
  interface Database {
    close: void;
  }
  ```

  Closes the database.

  This will close the native handle on the current connection and reset it. The connection will be reestablished if any other method is called.
