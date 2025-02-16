---
outline: deep
---

# Query API: Transaction

## selectFrom()

- **Summary**

  ```ts
  trx.selectFrom<Store extends keyof Schema>(store: Store): SelectQueryBuilder;
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
  trx.update<Store extends keyof Schema>(store: Store): UpdateQueryBuilder;
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
  trx.deleteFrom<Store extends keyof Schema>(store: Store): DeleteQueryBuilder
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
