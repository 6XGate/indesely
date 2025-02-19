---
outline: deep
---

# Migration API: StoreBuilder

The store builder is used to modify a new or existing object store.

## indices

- **Summary**

  ```ts
  class StoreBuilder {
    indices: string[];
  }
  ```

  Gets the names of the indices of the store.

## name

- **Summary**

  ```ts
  class StoreBuilder {
    name: string;
  }
  ```

  Gets the name of the store.

## createIndex()

- **Summary**

  ```ts
  class StoreBuilder {
    createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): StoreBuilder;
  }
  ```

- **Parameters**

  - `name` — The name of the index to create.
  - `keyPath` — The path or paths to the index key values.

## dropIndex()

- **Summary**

  ```ts
  class StoreBuilder {
    dropIndex(name: string): StoreBuilder;
  }
  ```

- **Parameters**

  - `name` — The name of the index to drop.
