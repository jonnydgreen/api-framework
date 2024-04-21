# Union API Design

Union types let you return multiple different object types from the same
endpoint.

## Principles

The following principles should be followed when designing the Union API:

- [ ] Prefer explicitness over implicitness
- [ ] Ensure maximum type-safety
- [ ] Opionated API which encourages REST API / OpenAPI best practises
- [ ] All of the information is needed to generate an OpenAPI spec compliant use
      of `oneOf`
- [ ] [optional] Compliant with GraphQL

### API Examples

```typescript
export interface ObjectType {
  __typename: string;
}

export class Apple implements ObjectType {
  public __typename!: "Apple";
  public ripeness!: string;
  public color!: string;
}

// ...other fruit types here...
```

```typescript
export class Controller {
  @Post({ outputType: Union(Orange, Apple, JackFruit) })
  public getHelloUnion(): Orange | Apple | JackFruit {
    return {
      __typename: "Orange",
      ripeness: "ripe",
      tang: "tangy",
    };
  }
}
```

#### Type-Safety Explanation

If anything is returned which is not of the three types, a TypeScript error is
emitted:

```typescript
export class Controller {
  @Post({ outputType: Union(Orange, Apple, JackFruit) })
  // ERROR: Argument of type '() => String' is not assignable to parameter of type '(...args: any[]) => Apple | Orange | JackFruit'.
  public getHelloUnion(): string {
    return "hey";
  }
}
```

If anything is inputted which is not of the three types, a TypeScript error is emitted:

```typescript
// Argument of type '() => Orange | Apple | JackFruit' is not assignable to parameter of type '(...args: any[]) => Orange | Apple'.
@Post({ outputType: Union(Orange, Apple) })
public getHelloUnion(): Orange | Apple | JackFruit {
return {
    __typename: "Orange",
    ripeness: "ripe",
    tang: "tangy",
};
}
```

### Breakdown

This can be achieved by creating a `Union` Function for use within the route
decorator function (e.g. `@Post`) which accepts any number of `ObjectTypes` and
forces the function to return a union type containing all the same
`ObjectTypes`.

For example:

```typescript
type UnionTypes<T> = T extends (infer U)[] ? MapScalar<U> : never;

function Union<U, T extends any[]>(
  first: MaybeClassType<U>,
  ...args: MaybeClassTypes<T>
): UnionTypes<[U, ...T]> {
  return unionKey as unknown as UnionTypes<[U, ...T]>;
}
```

`infer` is doing the heavy lifting here. It extracts and creates a union of all
of the types within an array.

### What are `ObjectType`s?

<!-- TODO move this to a better doc spot -->

This is the base class which every class in the API will extend. It forces every
class to define a `__typename` field. You might have seen this before when
working with GraphQL and GraphQL clients. Without this, a resolver-like funciton
would need to be defined which allowed us to figure out which type is being
returned during validation.

This is because we want developers to be able to return primitive objects which
correspond to the `ObjectType`s they defined.

```typescript
@Post({ outputType: Union(Orange, Apple, JackFruit), resolverFunc: (type) => {
  // Not needed! We can infer this from `__typename`
  if ("ripeness" in type) {
    return Orange
  }
} })
  public getHelloUnion(): Orange | Apple | JackFruit {
    return {
      ripeness: "ripe",
      tang: "tangy",
    };
  }
```

- [__typename is used in grapqhql clients](https://graphql.com/learn/interfaces-and-unions/#__typename),
  why not use it in the backend?
- __typename is always defined in every object type, so we dont need a
  type-resolver function
  [like this](https://typegraphql.com/docs/unions.html#resolving-type)
-

