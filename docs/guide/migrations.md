---
outline: deep
---

# Migrations

To make upgrading your databases in IndexedDB straightforward, Indesely includes a migration system that allows you to specify each migration for each version of the database.

## How They Work

Indesely allows you to define migrations for each version of your database by providing a migration function a given version. When you define your database, you will need to give it a list of all the migrations, from the first version to the latest. Each time you connect to your database, Indesely will run any necessary migrations before the connections first transaction.

:::tip
You do not have to limit each migration to one operations. In fact, it is preferred if you do not.
:::

:::warning
Once a migration is written, it should not be changed. Doing so could leave the database in an unusable state.
:::

When Indesely is notified that it needs to upgrade the database, it will run each migration function just after the current version. Each function is run within an _upgrade_ transaction. That transaction is passed to each migration function.

:::info
Indesely schemas are not defined as migrations, but migrations should create or alter a store to match the current database schema. See [Defining a Schema](defining-the-schema) for more information.
:::

## Creating Object Stores

Creating object stores is the first step to creating a database. Simply give the store a name. The store in the following example will use manual keys. Creating a store is done with [`createStore`](/reference/database-builder#createstore).

```ts
(trx) => {
  // Store with manually defined keys.
  trx.createStore('employees');
};
```

If your store will use a field in the records for its key, the path to that field should be specified.

```ts
(trx) => {
  // Store with keys automatically determined from the model.
  trx.createStore('employees', 'id');
};
```

If your store will use an auto-incrementing, then [`AutoIncrement`](/reference/schema#autoincrement) should be specified.

```ts
(trx) => {
  // Store with auto incrementing keys.
  trx.createStore('employees', AutoIncrement);
};
```

:::warning
IndexedDB does not provide a means to change the key of a store; so once a store is created, the key cannot be changed. To change the key, you will first need to replace a current store with a new one.
:::

## Defining Indices

To define an index, you first need to create a new store or open an existing store for alterations. When creating an index, you must give it a name and a path to the field from which the index will be populated. You may also specify [IndexedDB index options](https://developer.mozilla.org/docs/Web/API/IDBObjectStore/createIndex#options) for the new index. Creating an index is done with [`createIndex`](/reference/store-builder#createindex).

```ts
(trx) => {
  trx.createStore('employees', 'id').createIndex('name', 'name', { unique: true });
  trx.createStore('employees', 'id').createIndex('department', 'departmentId');
};
```

## Altering Object Store

To create or drop indexes on an object store, you will first need to open it for alteration. This is done with [`alterStore`](/reference/database-builder#alterstore).

```ts
(trx) => {
  trx.alterStore('department').createIndex('manager', 'managerId');
};
```

## Dropping Indices

Dropping an index is done by simply calling [`dropIndex`](/reference/store-builder#dropindex) on an object store.

```ts
(trx) => {
  trx.alterStore('department').dropIndex('lead');
};
```

## Dropping Object Stores

If you no longer need an object store, or are replacing one, you can drop the a store by calling [`dropStore`](/reference/database-builder#dropstore)

```ts
(trx) => {
  trx.dropStore('leaders');
};
```

## Updating Data

You can also use the same operations of reading and writing data within a migration. This allows you to upgrade the structure of the state before and after altering stores and their indices. See [Reading and Writing Data](reading-and-writing-data) for more information. But remember to make your migrations asynchronous when you read and write data.

```ts
async (trx) => {
  // Read or write any data and make any store or index alterations.
};
```

## What's Next?

- Learn how to getting and retrieving records by read about [Reading and Writing Data](reading-and-writing-data)

- Learn how to list and delete database by reading [Managing Database](managing-databases).
