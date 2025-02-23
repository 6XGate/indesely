---
outline: deep
---

# Query API: Transaction

## abort()

- **Summary**

  ```ts
  class Transaction {
    abort(): void;
  }
  ```

  Forcibly aborts the transaction.

## selectFrom()

- **Summary**

  ```ts
  class Transaction {
    selectFrom<Store extends keyof Schema>(store: Store): SelectQueryBuilder;
  }
  ```

  Provides a query builder for selection queries.

- **Parameters**

  - `store` — The name of the store from which select records.

- **Type Parameters**

  - `Store` — The name of the store from which select records.

- **Returns**

  The [`SelectQueryBuilder`](select-query-builder) to define and perform a selection query.

## update()

- **Summary**

  ```ts
  class Transaction {
    update<Store extends keyof Schema>(store: Store): UpdateQueryBuilder;
  }
  ```

  Provides a query builder for update queries.

  :::warning

  Only available during migration and read/write transactions.

  :::

- **Parameters**

  - `store` — The name of the store to update.

- **Type Parameters**

  - `Store` — The name of the store to update.

- **Returns**

  The [`UpdateQueryBuilder`](update-query-builder) to perform update operations.

## deleteFrom()

- **Summary**

  ```ts
  class Transaction {
    deleteFrom<Store extends keyof Schema>(store: Store): DeleteQueryBuilder;
  }
  ```

  Provides a query builder for deletion queries.

  :::warning

  Only available during migration and read/write transactions.

  :::

- **Parameters**

  - `store` — The name of the store from which to delete records.

- **Type Parameters**

  - `Store` — The name of the store from which to delete records.

- **Returns**

  The [`DeleteQueryBuilder`](delete-query-builder) to perform deletion operations.
