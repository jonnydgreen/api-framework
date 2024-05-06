# Endpoint API design

## Principles

The following principles should be followed when designing the validation API:

- [ ] Merge with the existing type definition API so it is inbuilt out of the
      box
- [ ] Always on

## Type definition

Leads:

- @jonnydgreen
- @aleccool213

## Object type

An Object type definition with nested support is defined as follows:

```typescript
@ObjectType()
export class Nested {
  @Field({ type: String })
  public foo!: string;
}

@ObjectType()
export class Hello {
  @Field({ type: String })
  public name!: string;

  @Field({ type: String })
  public address!: string;

  @Field({ type: Boolean })
  public isCool!: boolean;

  @Field({ type: Nested })
  public nested!: Nested;
}
```

Each object type must be defined with an `ObjectType` decorator to make sure it
is correctly registered.

### Validation

When validating the above, the follow errors will occur:

Input:

```jsonc
{
  "name": "name",
  "address": 2, // Should be a string
  "isCool": true,
  "nested": {
    "foo": 1
  }
}
```

Error:

```json
[
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "address"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "nested",
      "foo"
    ],
    "message": "Expected string, received number"
  }
]
```
