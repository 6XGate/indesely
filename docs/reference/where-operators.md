---
outline: deep
---

# Where Operators

The selection and deletion queries use operators to allows comparing a key value with the keys in records or indices.

```ts
/** Comparison operators of the where clause. */
type Compares = '=' | '<' | '<=' | '>=' | '>';
/** Bounds operators of the where clause. */
type Bounds = '[]' | '()' | '(]' | '[)';
/** Operators of the where clause. */
type Operators = Compares | Bounds;
```

- `=` — Checks that the record key equals the specified key.
- `<` — Checks that the record key is less than the specified key
- `<=` — Checks that the record key is less than or equal to the specified key
- `>=` — Checks that the record key is greater than or equal to the specified key
- `>` — Checks that the record key is greater than the specified key
- `[]` — Checks that the record key is within or includes the specified lower and upper bounds. Synonymous with `lower <= key && key <= upper`.
- `()` — Checks that the record key is within the specified lower and upper bounds. Synonymous with `lower < key && key < upper`.
- `(]` — Checks that the record key is within the specified lower and within or includes the upper bounds. Synonymous with `lower < key && key <= upper`.
- `[)` — Checks that the record key is within or include the specified lower and within the upper bounds. Synonymous with `lower <= key && key < upper`.
