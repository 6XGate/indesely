---
outline: deep
---

# Migration API: Migrations

## Migration()

- **Summary**

  ```ts
  type Migration = (transaction: DatabaseBuilder) => void;
  ```

  Migration function.

- **Parameters**

  - `transaction` — The [DatabaseBuilder](database-builder) to use in the transaction.
