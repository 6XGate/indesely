---
outline: deep
---

# Defining the Schema

## Models

```ts
interface Employee {
  id: number;
  name: string;
  address?: string | undefined;
  cell?: string | undefined;
  departmentId: string;
}
```

## Store Schema

### Basic Store

```ts
// Store with a model
type Employees = Store<Employee>;
```

### Defining a Key

```ts
// Store with a model and path to a store key in the model.
type Employees = Store<Employee, 'id'>;
```

### Defining Indices

```ts
// Store with a model, a key, and indices with paths to indexed value.
type Employees = Store<Employee, 'id', { department: 'departmentId' }>;
```

## Store Keys

### From a Model Field

```ts
// Store with a model and path to a store key in the model.
type Employees = Store<Employee, 'id'>;
```

### Manually Defined

```ts
interface Employee {
  // id: string;
  name: string;
  // ...
}

// Store with a model and manual key.
type Employees = Store<Employee>;
```

```ts
// Also, a store with a model and manual key.
type Employees = Store<Employee, ManualKey>;
```

### Auto Incrementing

```ts
interface Employee {
  // id: string;
  name: string;
  // ...
}
```

```ts
// Store with a model and auto-increment key.
type Employees = Store<Employee, AutoIncrement>;
```

### From a Model Path

```ts
// The key can reference values deep in the object, for example:
type Employees = Store<Employee, 'ids.number'>;
type Employees = Store<Employee, 'ids.ssn'>;
type Employees = Store<Employee, 'ids.dln'>;
```

## Store Indices

### From a Model Field

```ts
// Store with a model, a key, and indices with paths to indexed value.
type Employees = Store<Employee, 'id', { department: 'departmentId' }>;
```

### From a Model Path

```ts
// Indices can reference values deep in the object, for example:
type Employees = Store<Employee, 'id', { department: 'departments.mainId' }>;
type Employees = Store<Employee, 'id', { department: 'departments.secondaryId' }>;
```

## Database Schema

```ts
type Employees = Store<...>;
type Departments = Store<...>l
interface Employment {
  employees: Employees;
  departments: Departments;
}
```

## Database Factory

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
