# Endpoint API design

## Principles

The following principles should be followed when designing the endpoint API:

- [ ] Prefer explicitness over implicitness
- [ ] Make documentation a first-class citizen
- [ ] Ensure type-safe decorators
- [ ] Define endpoints in a consistent manner
- [ ] Ensure the API is clean and easy to use/understand
- [ ]

## Endpoint definition

Leads:

- @jonnydgreen
- @aleccool213

### Controller

```typescript
@Controller({
  route: "/hello",
})
export class Controller {}
```

### Router

```typescript
export class Controller {
  @Post({
    description: "Some description.",
    route: "/there",
    response: Hello,
  })
  public getHelloThere(): Hello {
    return {
      name: "name",
      address: "address",
    };
  }
}
```

## Type definitions

A lot of issues with current frameworks is the inconsistency in defining types.
This is a proposal to define types in a consistent manner with the use of
type-safe decorators.

### Basic

Lead: @jonnydgreen

```typescript
@ObjectType({
  description: "Some description.",
  examples: [{
    name: "Hello",
    address: "1 Strawberry Fields, Fruitsville, B12 YUM",
  }],
})
export class Hello {
  @Field({
    description: "Some description.",
    examples: ["Hello"],
    type: String,
  })
  name!: string;

  @Field({
    description: "Some description.",
    examples: ["1 Strawberry Fields, Fruitsville, B12 YUM"],
    type: String,
  })
  address!: string;
}
```

### List

Lead: @jonnydgreen

#### Usage

```typescript
export class HelloController {
  @Post({ outputType: List(Hello) })
  public getHelloList(): Hello[] {
    return [{
      name: "name",
      address: "address",
    }];
  }
}
```

#### Definition

```typescript
function List<T>(input: MaybeClassType<T>): T[] {
  return listKey as unknown as T[];
}
```

### Tuple

Lead: @jonnydgreen

```typescript
export class HelloController {
  @Post({ outputType: Tuple(Hello, String, Number, Hello) })
  public getHelloTuple(): [Hello, string, number] {
    return [
      {
        name: "name",
        address: "address",
      },
      "hello",
      1,
      {
        name: "name",
        address: "address",
      },
    ];
  }
}
```

#### Definition

```typescript
function Tuple<U, T extends any[]>(
  first: MaybeClassType<U>,
  ...args: MaybeClassTypes<T>
): MapTypes<[U, ...T]> {
  return tupleKey as unknown as MapTypes<[U, ...T]>;
}
```

### Union

Lead: @aleccool213

### Response

Lead: ?

### Inputs

#### Params

Lead: ?

#### Querystring

Lead: ?

#### Headers

Lead: ?

#### Body

Lead: ?
