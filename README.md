# Indesely

[IndexedDB](https://6xgate.github.io/indesely/) with Kysely Style

[![License: MIT](https://img.shields.io/npm/l/indesely.svg?style=flat-square&label=License)](https://github.com/6xgate/indesely/blob/master/LICENSE)
[![NPM version](https://img.shields.io/npm/v/indesely.svg?style=flat-square&logo=npm&label=Latest)](https://www.npmjs.com/package/indesely)
[![Coverage status](https://img.shields.io/github/actions/workflow/status/6XGate/indesely/.github%2Fworkflows%2Fcoverage.yml?style=flat-square&logo=github&label=Coverage)](https://github.com/6XGate/indesely/actions/workflows/coverage.yml)
[![Styling status](https://img.shields.io/github/actions/workflow/status/6XGate/indesely/.github%2Fworkflows%2Fstyling.yml?style=flat-square&logo=github&label=Styling)](https://github.com/6XGate/indesely/actions/workflows/styling.yml)

---

**[Documentation](https://6xgate.github.io/indesely/)** — **[GitHub](https://github.com/6XGate/indesely)** — **[Package](https://www.npmjs.com/package/indesely)**

## Getting Started

To use Indesely, your application must run on a modern web browser, or similar application framework, that supports IndexedDB. Indesely is provided as a ECMAScript library via NPM. It may be used with any bundler that supports ESM or used directly by your web application.

## Installing

To install and use Indesely via NPM, you must have node.js and your favorite package manager installed.

<details>
  <summary>npm</summary>

```sh [npm]
npm install indesely
```

</details>

<details>
  <summary>yarn</summary>

```sh [yarn]
yarn add indesely
```

</details>

<details>
  <summary>pnpm</summary>

```sh [pnpm]
pnpm install indesely
```

</details>

## Quick Example

To use the type-safe facilities of Indesely, you will need to defined a model and provide information about your database's object stores. Then define a schema for your database based on the names of your object stores.

### Models, Keys, and Indices

First, you'll need the models for your object stores.

```ts [models.ts]
interface Employee {
  id: number;
  name: string;
  address?: string | undefined;
  cell?: string | undefined;
  departmentId: number;
}

interface Department {
  id: number;
  name: string;
}
```

Next, you'll need to provide the basic information about your object store's keys an indices.

```ts [models.ts]
interface Employee {
  /* ... */
}

// Employee's key is `id` and we want to index `departmentId` with the `department` index.
type Employees = Store<Employee, 'id', { department: 'departmentId' }>;

interface Department {
  /* ... */
}

// Department's key is `id`.
type Departments = Store<Department, 'id'>;
```

### Database Schema

Once your models and object store information is defined, you can then define your database schema. This will tell Indesely what the names of your object stores are and what structure they have.

```ts [employment.ts]
interface Employment {
  employees: Employees;
  departments: Departments;
}
```

With that, you can then defined a factory for your database, with some basic migrations to set up the structure.

```ts [employment.ts]
interface Employment {
  /* ... */
}

const useEmploymentDatabase = defineDatabase<Employment>({
  name: 'employment',
  migrations: [
    // Sets up version 1 of the data.
    (trx) => {
      trx.createStore('employees', 'id').createIndex('department', 'departmentId');
      trx.createStore('departments', 'id');
    },
  ],
});
```

### Connection

Once you've defined the database. You need to connect to it, in a sense. IndexedDB's idea of a connection isn't the same as most RDBMSs, it's really a handle or descriptor to the database like SQLite.

```ts [seed.ts]
const db = useEmploymentDatabase();
```

### Writing Data

Now that you have a database, it needs some data to be useful. Adding objects to it is almost as easy as using local storage. You just have to start a read/write transaction. With IndexedDB, you have to tell it to which stores you want to write, and you must with Indesely too.

Indesely will even give you a type-safe check when you start an operations to ensure you request a change or read from those stores.

```ts [seed.ts]
// ...

await db.change(['employees', 'departments'], async (trx) => {
  await trx.insertInfo('departments').add({ id: 1, name: 'DevOps' });
  await trx.insertInfo('departments').add({ id: 2, name: 'Product' });
  await trx.insertInto('employees').add({ id: 1, name: 'Fred', departmentId: 1 });
  await trx.insertInto('employees').add({ id: 2, name: 'Jane', departmentId: 1 });
  await trx.insertInto('employees').add({ id: 3, name: 'Bob', departmentId: 2 });
  await trx.insertInto('employees').add({ id: 4, name: 'Terra', departmentId: 2 });
});
```

### Reading Data

Now that you've put data in your database stores, you can query that data. IndexedDB, while powerful, doesn't support a very complex query language. It only has a few operations on keys and indices and the ability to define a range or value to query.

Say you want everyone in the Product departments.

```ts [read.ts]
const productFolks = await db.read(['employees'], async (trx) => {
  return await trx.selectFrom('employees').where('department', '=', 2).getAll();
});

console.log(productFolks);
// Writes the following to the console.
// [
//   { id: 3, name: 'Bob', departmentId: 2 },
//   { id: 4, name: 'Terra', departmentId: 2 },
// ]
```

## Learning More

Now that you've seen the basic concepts of Indesely, you can learn more in depth information about the it and its API.

For more about the core concepts;

- To better understand defining models, the keys of models, the indices of an object store, and the schema of a database; read the guide for [Defining the Schema](https://6xgate.github.io/indesely/guide/defining-the-schema).
- To learn how write migrations to upgrade your database with each new version, read about [Migrations](https://6xgate.github.io/indesely/guide/migrations).
- To learn all about reading data from object store, or writing data to them; read about [Reading and Writing Data](https://6xgate.github.io/indesely/guide/reading-and-writing-data).

Once you understand the core concepts;

- You can see in depth documentation about the [Indesely API](https://6xgate.github.io/indesely/reference/management).
- You can even manage your databases [Managing Databases](https://6xgate.github.io/indesely/guide/managing-databases).
