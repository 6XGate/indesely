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

  - `transaction` — The [DatabaseBuilder](database-builder) transaction to use in the migration. Unlike normal transactions, migration transactions do not enforce schema type information.
