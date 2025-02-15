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

```ts
// Store with a model
type Employees = Store<Employee>;
```

```ts
// Store with a model and path to a store key in the model.
type Employees = Store<Employee, 'id'>;
```

```ts
// Store with a model, a key, and indices with paths to indexed value.
type Employees = Store<Employee, 'id', { department: 'departmentId' }>;
```

## Model Keys

```ts
// Store with a model and path to a store key in the model.
type Employees = Store<Employee, 'id'>;
```

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

```ts
// The key can reference values deep in the object, for example:
type Employees = Store<Employee, 'ids.number'>;
type Employees = Store<Employee, 'ids.ssn'>;
type Employees = Store<Employee, 'ids.dln'>;
```

## Store Indices

```ts
// Store with a model and key, but no indices.
type Employees = Store<Employee, 'id'>;
```

```ts
// Store with a model, a key, and indices with paths to indexed value.
type Employees = Store<Employee, 'id', { department: 'departmentId' }>;
```

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

> TODO: About migrations

> TODO: About

> TODO: About managing database.
