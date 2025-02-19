---
outline: deep
---

# Migrations

To make upgrading your databases in IndexedDB straightforward, Indesely includes a migration system that allows you to specify each migration for each version of the database.

## How They Work

Indesely allows you to define migrations for each version by providing the migration function that a givin version of the database. When you define your database, you will need to give it a list of all the migrations function, from the version first version to the latest. Each time you connect to your database, usually initiated on the first transaction. Indesely will be notified that it needs to upgrade the database with the current version. It will then run each migration function you provided just after the current version to the latest.

<!-- TODO: Example of processes. -->

## Creating Object Stores

```ts
(trx) => {
  trx.createStore('employees');
};
```

```ts
(trx) => {
  trx.createStore('employees', 'id');
};
```

```ts
(trx) => {
  trx.createStore('employees', AutoIncrement);
};
```

## Defining Indices

```ts
(trx) => {
  trx.createStore('employees', 'id').createIndex('department', 'departmentId');
};
```

## Altering Object Store

```ts
(trx) => {
  trx.alterStore('department').createIndex('manager', 'managerId');
};
```

## Dropping Indices

```ts
(trx) => {
  trx.alterStore('department').dropIndex('lead');
};
```

## Dropping Object Stores

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
