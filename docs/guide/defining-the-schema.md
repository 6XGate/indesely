---
outline: deep
---

# Defining the Schema

Defining a schema comes in a few parts. The first and most important part is the [model of the objects](#models), also called records, in your object stores. The next is how you will reference, or key, you objects, called the [primary key](#defining-a-key). And finally, how you want to [index the data](#defining-indices).

## Models

The model defines the shape of the record objects that will be stored in your object stores. This is usually an object with a defined set of required and optional fields. Record models should be fully supported by the [structured clone algorithm](https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

```ts
interface Employee {
  id: number;
  name: string;
  address?: string | undefined;
  cell?: string | undefined;
  departmentId: string;
}
```

Models only define the type information about the objects. Currently, IndexedDB, and Indesely by proxy at the moment, does not support validation of a schema. For schema validation, we recommend using [zod](https://zod.dev/) for the best development experience. But keep in mind that such validation will carry a performance cost.

## Store Schema

The store schema defines not just the model for an object store, but also tell Indesely the primary key and indices of that store. To define a store, use the [Store](/reference/schema#store) type.

### Basic Store

The most basic store is one that has manually defined keys for each record of any type valid in IndexedDB and no indices. These stores will alway require a key parameter when add, updating, and replacing models. They will also have no ability to use index operations.

```ts
type Employees = Store<Employee>;
```

### Defining a Key

You can also define the key for a store. One way is to define a path where IndexedDB will automatically get the key from the record object itself, also called a key path. You can also define the type of manually specified keys and auto incrementing keys for a store. See [Store Keys](#store-keys) later for more information.

```ts
// Store with a model and path to a store key in the model.
type Employees = Store<Employee, 'id'>;
```

### Defining Indices

Indices are defined as an interface or type that maps an index name to a path to the index value from the record. Indies may not have manual or auto increment keys, but must come from the model itself. Indices can be used as other ways to sort and query records rather than the primary key. See [Store Indices](#store-indices) for more information.

```ts
// Store with a model, a key, and indices with paths to indexed value.
type Employees = Store<Employee, 'id', { department: 'departmentId' }>;
```

## Store Keys

The following examples will show each of the means of defining a store key and what that means for your object store.

### From a Model Field

Using the name of one of the fields of the model results in the key of the store always being based on the value of that field in a record. It also means that each record must have a unique value for that field. Any attempt to put a new record in the store with the same value in that field will either result in an error or replacing the existing record depending on whether using [`add`](/reference/update-query-builder#add) or [`put`](../reference/update-query-builder#put) respectively.

```ts
// Store with a model and path to a store key in the model.
type Employees = Store<Employee, 'id'>;
```

### Manually Defined

Using manually defined key, specified using [`ManualKey`](/reference/schema#manualkey), requires that each addition or update to the store be given a value for the primary key. Reusing an existing key will either result in an error or replacing the existing record depending on whether using [`add`](/reference/update-query-builder#add) or [`put`](/reference/update-query-builder#put) respectively. [`ManualKey`](/reference/schema#manualkey) is the default key specification for [`Store`](/reference/schema#store), so can be omitted.

```ts
interface Employee {
  // id: string;
  name: string;
  // ...
}

// Store with a model and manual key.
type Employees = Store<Employee>;
// Also, a store with a model and manual key.
type Employees = Store<Employee, ManualKey>;
```

But, using manual keys by default means any valid IndexedDB key value may be used as a key for your store. To specify the type of the key, you can give that type to [`ManualKey`](/reference/schema#manualkey).

```ts
// Also, a store with a model and manual key of a specific type.
type Employees = Store<Employee, ManualKey<number>>;
```

### Auto Incrementing

Using auto-incrementing keys, specified using [`AutoIncrement`](/reference/schema#autoincrement), means that each newly added records will have its own numeric key that is one more than the prior added record. Replacing record requires using the same key with [`put`](/reference/update-query-builder#put) as the record you want to replace.

```ts
interface Employee {
  // id: string;
  name: string;
  // ...
}

// Store with a model and auto-increment key.
type Employees = Store<Employee, AutoIncrement>;
```

### From a Model Path

Must like model fields, model path just uses the value from deep within the record based on the path.

```ts
// The key can reference values deep in the object, for example:
type Employees = Store<Employee, 'ids.number'>;
type Employees = Store<Employee, 'ids.ssn'>;
type Employees = Store<Employee, 'ids.dln'>;
```

## Store Indices

Object store indices are defined using an object type or interface that maps the index's name to its field or path. Much like primary keys using paths, the value of keys in an index is taken from record itself. Depending on whether the index is unique or not, value may not or may be shared with the same field in multiple records.

- **From a Model Field**

  ```ts
  // Store with a model, a key, and indices with paths to indexed value.
  type Employees = Store<Employee, 'id', { department: 'departmentId' }>;
  ```

- **From a Model Path**

  ```ts
  // Indices can reference values deep in the object, for example:
  type Employees = Store<Employee, 'id', { department: 'departments.mainId' }>;
  type Employees = Store<Employee, 'id', { department: 'departments.secondaryId' }>;
  ```

## Database Schema

Once your stores are define. You will then want to define the schema of your database. This is simply just an [object type or interface](/reference/database) that maps a stores name to its object store schema.

```ts
type Employees = Store<...>;
type Departments = Store<...>l
interface Employment {
  employees: Employees;
  departments: Departments;
}
```

## Database Factory

Once a schema defined define, all that remains is creating a [`DatbaseFactory`](../reference/database#usedatabase) using [`defineDatabase`](/reference/management#definedatabase). When defining a database, you will want to give it the options for a name and an array of [migrations](../guide/migrations).

```ts
const useEmploymentDatabase = defineDatabase<Employment>({
  name: 'employment',
  migrations: [...];
})
```

## What's Next?

- Learn about upgrading the object stores and indices between database version by read about [Migrations](migrations).

- Learn how to getting and retrieving records by read about [Reading and Writing Data](reading-and-writing-data)

- Learn how to list and delete database by reading [Managing Database](managing-databases).
