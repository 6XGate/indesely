---
outline: deep
---

# Managing Databases

There are only a few database management needs to cover in IndexedDB, and Indesely handles them with two simple functions.

## Listing and Deleting Database

- Listing databases is accomplished with [`listDatabases()`](/reference/management#listdatabases). This will give you an array of database names that are currently stored for the current origin.

  ```ts
  // Will output the array of IndexedDB database.
  console.log(await listDatabase());
  ```

- Deleting a database you no longer need is accomplished with [`deleteDatabase()`](/reference/management#dropdatabase). This will allow you to delete database only belonging to the current origin.

  ```ts
  await dropDatabase('products');
  ```

## What's Next?

- For more in depth knowledge about Indesely, read the [API Reference](/reference/management)
