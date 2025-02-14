---
outline: deep
---

# What is Indesely?

Indesely is a light weight, type-safe, and easy to use library for using
IndexedDB database in modern web browsers. It allows you to define
easily define models, keys, indices, and migrations for the
data you want to store in IndexedDB. From there your
web application can store any data in a fast
and efficient key value object store.

<div class="tip custom-block" style="padding-top: 8px">

Want to jump in and try is out? Skip to
[Getting Started](getting-started).

</div>

## Why Indesely?

Because Indesely allows you define the shape of data, as well as keys and names
by which to index it; it can help you make sure your code only references the
data and indices of your object stores when writing and querying data.
Indesely was written in TypeScript to bring these features and
and first class type support.

Querying data is simple.

```ts [example.ts]
// Use the defined employment database.
const db = useEmploymentDatabase();
// Start a read transaction on the employees store.
const employee = await db.read(['employees'], async (trx) => {
  // Find the record for Fred.
  return await trx
    .selectFrom('employees')
    .where('name', '=' 'Fred White')
    .getFirst();
});

// If found, add it to the document.
if (employee != null) {
  const nameInfo = document.createElement('p');
  const addressInfo = document.createElement('p');
  const cellInfo = document.createElement('p');

  nameInfo.innerText = employee.name;
  addressInfo.innerText = employee.address;
  cellInfo.innerText = employee.cell;

  document.body.appendChild(nameInfo);
  document.body.appendChild(addressInfo);
  document.body.appendChild(cellInfo);
}
```

<div class="tip custom-block" style="padding-top: 8px">

To learn more about models, see [Reading and Writing Data](reading-and-writing-data)

</div>

## Models, Keys, and Indices

To allow Indesely to make your data type-safe, you must define models. Defining
models and indices of the stores is easy. Models are just interface, keys
of those models and indices are part of the store's schemas, and
those stores make up a wider database schema.

<div class="tip custom-block" style="padding-top: 8px">

To learn more about models, see [Defining the Schema](defining-the-schema)

</div>

## Migrations

IndexedDB supports the basic framework for versioning and upgrading the object
stores of a database. Indesely provides an easy to use and powerful means
of defining upgrade migrations for your database.

<div class="tip custom-block" style="padding-top: 8px">

To learn more about models, see [Migrations](migrations)

</div>

## More About IndexedDB

If you want to learn more about IndexedDB, the means by which Indesely stores
data, its principles, and security considerations; you can read more at the
[MDN IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API)
documentation.
