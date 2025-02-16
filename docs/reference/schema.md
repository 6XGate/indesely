---
outline: deep
---

# Database API: Schema

- **Summary**

  ```ts
  type Store<Model, Key = ManualKey, Indices = {}>
  ```

  Stores schema are defined using the `Store` type,

- **Type Parameters**

  - [`Model`](#models) — The model of the object store's records.
  - [`Key`](#keys) — The key source for the model. This can be either a [path](#key-paths) to a member of the model, [`AutoIncrement`](#auto-incrementing-keys) for an auto-incrementing key, or the default [`ManualKey`](#manual-keys) for a manually specified key.
  - [`Indices`](#indices) — An interface describing the indices of the object store.

## Models

Record models are just any [structured clone](https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) compatible interface.

## Indices

```ts
type Indices = { [name: string]: string };
```

Indices are an interface of index names to [key paths](#key-paths) of the record. When using an index, the index name is referenced and not the key path. The index key may reference be any value that is compatible with the primary key.

## Keys

Primary keys for an object store may be a path to the key within the model, a manually specified key, or an auto-incremented key. The referenced or provided key values must be `number`, `string`, `Date`, binary blobs, and arrays of those types.

### Key Paths

Key paths are specified as a string of period, `.`, separated values; for example `name.full`.

### Manual Keys

Manually provided keys are not stored in the record. Using them as the primary key may offer more flexibility when dealing with certain kinds of data.

### Auto Incrementing Keys

Auto-incrementing key are stored like manual keys, but are automatically incremented with each new record.
