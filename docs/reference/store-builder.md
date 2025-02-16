---
outline: deep
---

# Migration API: StoreBuilder

The store builder is used to modify a new or existing object store.

## createIndex()

- **Summary**

  ```ts
  store.createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): StoreBuilder
  ```

- **Parameters**

  - `name` — The name of the index to create.
  - `keyPath` — The path or paths to the index key values.

## dropIndex()

- **Summary**

  ```ts
  store.dropIndex(name: string): StoreBuilder
  ```

- **Parameters**

  - `name` — The name of the index to drop.
