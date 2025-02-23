---
outline: deep
---

# Reading and Writing Data

Read and writing data with Indesely, just like IndexedDB, starts with a transaction. Once a transaction is started, you may read or write data to the database depending on the kind of transaction.

## Starting Transactions

Transactions come in three flavors; _read-only_, _read/write_, and _upgrade_. The _read-only_, _read/write_ transaction are the ones you will use to read and write data during normal operations. Upgrade transactions are only available during migrations, which can also perform most of same functions as _read/write_ transactions.

To start a transaction, you will call either [`Database.read`](/reference/database#read) or [`Database.change`](/reference/database#change) with a list of object store you will interact with. For example:

```ts
// Start a read-only transaction.
db.read(['employees'], async (trx) => {
  /* ... */
});
// Start a read/write transaction.
db.change(['employees'], async (trx) => {
  /* ... */
});
```

Any attempt to interact with any store other than the ones specified will result in an error.

You can learn more about them upgrade transaction by reading about [Migrations](migrations).

## Inserting and Updating Records

:::info
Coming soon! See the [Update Query Builder API Reference](/reference/update-query-builder) for now.
:::

## Reading Records and Keys

:::info
Coming soon! See the [Select Query Builder API Reference](/reference/select-query-builder) for now.
:::

## Querying on Keys and Indices

:::info
Coming soon! See the [Select Query Builder API Reference](/reference/select-query-builder) for now.
:::

## Deleting Records

:::info
Coming soon! See the [Delete Query Builder API Reference](/reference/delete-query-builder) for now.
:::

## What's Next?

- Learn how to list and delete database by reading [Managing Database](managing-databases).
