---
outline: deep
---

# Reading and Writing Data

Read and writing data with Indesely, just like IndexedDB, starts with a transaction. Once a transaction is started, you may read or write data to the database depending on the kind of transaction.

## Starting Transactions

Transactions come in three flavors; _read-only_, _read/write_, and _upgrade_. You can read data in any type of transaction. But, you write data, you will need a _read/write_ or _upgrade_ transaction.

:::info
Upgrade transactions are only available during migrations, and can perform the same functions as _read/write_ transactions. You can read more about them and [Migrations](migrations).
:::

To start a transaction, you will call either [`Database.read`](/reference/database#read) or [`Database.change`](/reference/database#change) with a list of object store you will interact with. For example:

```ts
// Start a read-only transaction.
await db.read(['employees'], async (trx) => {
  /* ... */
});
// Start a read/write transaction.
await db.change(['employees'], async (trx) => {
  /* ... */
});
```

Any attempt to interact with any store other than the ones specified will result in an error.

Interacting with IndexedDB using Indesely is done using a fluent query API much like that of Kysely. This abstracts some aspects of IndexedDB into easier to read code.

## Inserting and Updating Records

Before you can read any data from the database, you must first put some data in it. Inserting data is handle by the an [update query](/reference/update-query-builder) started by call [`update`](/reference/transaction#update) on the transaction. This may only be done in a _read/write_ or _upgrade_ transaction.

```ts
db.change(['employees'], async (trx) => {
  trx.update('employees');
});
```

### Adding data

To add new data, you would call [`add`](/reference/update-query-builder#add) to finish the update query.

```ts
await db.change(['employees'], async (trx) => {
  // If key is from `id`
  await trx.update('employees').add({ id: 4, name: 'River Tam' });
  // or; if the key must be manually specified.
  await trx.update('employees').add({ name: 'River Tam' }, 4);
});
```

With add, no other record may share the same key. So, calling add with a duplicate key, manual or otherwise, will result in an error.

### Updating data

With IndexedDB, you can add new records and update existing ones using the same function. This is typically called an _upsert_. To upsert records, you call [`put`](/reference/update-query-builder#put) to finish the query.

```ts
await db.change(['employees'], async (trx) => {
  // If key is from `id`
  await trx.update('employees').put({ id: 5, name: 'Kaywinnet Lee Frye' });
  // or; if the key must be manually specified.
  await trx.update('employees').put({ name: 'Kaywinnet Lee Frye' }, 5);

  // Updating employee 5

  // If key is from `id`
  await trx.update('employees').put({ id: 5, name: 'Kaywinnet Lee Tam' });
  // or; if the key must be manually specified.
  await trx.update('employees').put({ name: 'Kaywinnet Lee Tam' }, 5);
});
```

Unlike `add`, `put` will replace a record if one already exists with the same key. But keep in mind; IndexedDB, unlike SQL, does not have a dedicated update operation that will fail if not such record exists.

<div class="info custom-block" style="padding-top: 8px">

Checkout the [Update Query Builder API Reference](/reference/update-query-builder) for more information.

</div>

## Reading Records and Keys

Once you have data in your database, you can now read that data. Reading data is done through a [select query](/reference/select-query-builder), started by call [`selectFrom`](/reference/transaction#selectfrom). This may only be done in any transaction.

```ts
await db.read(['employees'], async (trx) => {
  trx.selectFrom('employees');
});
```

You can get data a few different way from an object store. For example, you can query all records on the current store using [`getAll`](/reference/select-query-builder#getall).

```ts
const employee = await db.read(['employees'], async (trx) => {
  return await trx.selectFrom('employees').getAll();
});
```

You can also stream all the records using a [`cursor`](/reference/select-query-builder#cursor) or async iterator function such as [`stream`](/reference/select-query-builder#stream).

```ts
await db.read(['employees'], async (trx) => {
  for await (const record of trx.selectFrom('employees').stream()) {
    dataTable.add(record):
  }
});
```

But, if you want to get specific records, or a range of records; you will need to constrain your query based on the store's key or indices.

### Querying on Keys and Indices

To constrain a query, you will need to add a where clause to it. Doing so allows you to query one specific records, or records that or within a certain range of keys. For example, to select only one employee by their key. You will need to call [`whereKey`](/reference/select-query-builder#wherekey) or [`where`](/reference/select-query-builder#where) with the `=` operator. Then, execute the query with [`getFirst`](/reference/select-query-builder#getfirst).

```ts
const employee = await db.read(['employees'], async (trx) => {
  return await trx.selectFrom('employees').whereKey('=', 5).getFirst();
});
```

You can also get a range of records based on a key or index. This can be done by with any of the relative comparison or range operators. For example, to get any employee with a salary greater than $80K.

```ts
const employees = await db.read(['employees'], async (trx) => {
  return await trx.selectFrom('employees').where('salary', '>', 80_000).getAll();
});
```

Or maybe you can get those in a range between and including $80K and 125K.

```ts
const employees = await db.read(['employees'], async (trx) => {
  return await trx.selectFrom('employees').where('salary', '[]', 80_000, 125_000).getAll();
});
```

<div class="info custom-block" style="padding-top: 8px">

To learn about more _where_ clause operators, see the [Where Operators](/reference/where-operators) reference.

</div>

Once a index _where_ clause is added to the query, the records it retrieves will be sorted by the keys of that index. But, if you want to sort by an index without adding a _where_ clause, you can use the [`by`](/reference/select-query-builder#by) clause.

```ts
const employees = await db.read(['employees'], async (trx) => {
  return await trx.selectFrom('employees').by('salary').getAll();
});
```

Keep in mind, you can only use `getFirst` and similar calls after a _where_ clause has been added to the query. `getAll`, `stream`, and similar calls are available at any point. You cannot add additional _where_ clauses to a query. Also, the `by` clause is actually a no-comparison _where_ clause, and cannot be mixed with other _where_ clauses.

<div class="info custom-block" style="padding-top: 8px">

To see more selection functionality, checkout the [Select Query Builder API Reference](/reference/select-query-builder).

</div>

## Deleting Records

When you need to remove data from your stores, you just have to use a [delete query](/reference/delete-query-builder) by calling [`deleteFrom`](/reference/transaction#deletefrom) on the transaction. You can either delete [`everything`](/reference/delete-query-builder#everything) in a store.

```ts
await db.change(['employees'], async (trx) => {
  await trx.deleteFrom('employees').everything();
});
```

You can also execute a delete on a specific key or range of keys using [`whereKey`](/reference/delete-query-builder#wherekey). This uses the same operators as the selection where, but immediately executes the deletion once called.

```ts
await db.change(['employees'], async (trx) => {
  await trx.deleteFrom('employees').whereKey('=', 4);
});
```

<div class="info custom-block" style="padding-top: 8px">

To learn more about, see the [Delete Query Builder API Reference](/reference/delete-query-builder).

</div>

## What's Next?

- Learn how to list and delete database by reading [Managing Database](managing-databases).
