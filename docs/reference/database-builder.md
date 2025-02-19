---
outline: deep
---

# Migration API: DatabaseBuilder

## createStore()

- **Summary**

  ```ts
  class DatabaseBuilder {
    createStore(name: string): StoreBuilder;
    createStore(name: string, autoIncrement: AutoIncrement): StoreBuilder;
    createStore(name: string, keyPath: string | string[]): StoreBuilder;
  }
  ```

  Creates a new object store with the specified name and options. If `autoIncrement` or `keyPath`, the store will have a manually specified key.

- **Parameters**

  - `name` — The name to give the new store.
  - `autoIncrement` — Indicates to use an auto-increment primary key.
  - `keyPath` — The path or paths to the primary key within the records.

- **Returns**

  Returns a [StoreBuilder](store-builder) for further modify the store.

## alterStore()

- **Summary**

  ```ts
  class DatabaseBuilder {
    alterStore(name: string): StoreBuilder;
  }
  ```

  Gets a [StoreBuilder](store-builder) to modify an existing object store.

- **Parameters**

  - `name` — The name of the object store to alter.

- **Returns**

  Returns a [StoreBuilder](store-builder) to modify the store.

## dropStore()

- **Summary**

  ```ts
  class DatabaseBuilder {
    dropStore(name: string): void;
  }
  ```

  Deletes an existing object store.

- **Parameters**

  - `name` — The name of the object store to delete.

## Inherited from Transaction

- [selectFrom()](transaction#selectfrom)
- [update()](transaction#update)
- [deleteFrom()](transaction#deletefrom)
