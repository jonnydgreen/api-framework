#!/usr/bin/env deno run

// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// deno-lint-ignore-file

export type ClassType<T> = new (...args: any[]) => T;

export type MaybeClassType<T> = ClassType<T> | T;

type MaybeClassTypes<T> = { [P in keyof T]: MaybeClassType<T[P]> };

type MapScalar<T> = T extends String ? string
  : T extends Number ? number
  : T extends Boolean ? boolean
  : T extends undefined ? undefined
  : T extends null ? null
  : T;

type MapTypes<T> = { [P in keyof T]: MapScalar<T[P]> };

export class Hello {
  public name!: string;
  public address!: string;
}

export interface ObjectType {
  __typename: string;
}

export class Apple implements ObjectType {
  public __typename!: "Apple";
  public ripeness!: string;
  public color!: string;
}

export class Orange implements ObjectType {
  public __typename!: "Orange";
  public ripeness!: string;
  public tang!: string;
}

export class JackFruit implements ObjectType {
  public __typename!: "JackFruit";
  public ripeness!: string;
  public jack!: string;
}

export interface PostOptions<R> {
  outputType: MaybeClassType<R>;
}

const listKey = Symbol("framework.list");

function List<T>(input: MaybeClassType<T>): T[] {
  return listKey as unknown as T[];
}

const tupleKey = Symbol("framework.tuple");

function Tuple<U, T extends any[]>(
  first: MaybeClassType<U>,
  ...args: MaybeClassTypes<T>
): MapTypes<[U, ...T]> {
  return tupleKey as unknown as MapTypes<[U, ...T]>;
}

const unionKey = Symbol("framework.union");

type UnionTypes<T> = T extends (infer U)[] ? MapScalar<U> : never;

function Union<U, T extends any[]>(
  first: MaybeClassType<U>,
  ...args: MaybeClassTypes<T>
): UnionTypes<[U, ...T]> {
  return unionKey as unknown as UnionTypes<[U, ...T]>;
}

export type MaybePromise<T> = T;

function Post<R>(options: PostOptions<R>) {
  return function post<T extends (...args: any[]) => MaybePromise<R>>(
    target: T,
    context: ClassMethodDecoratorContext,
  ): void {
    const methodName = context.name;
    if (context.private) {
      throw new Error(
        `'bound' cannot decorate private properties like ${methodName as string}.`,
      );
    }
    context.addInitializer(function (this: unknown) {
      const thisArg = this as ClassType<unknown>;
      const className = thisArg.constructor.name;
      console.log({ className, methodName, this: this, target, context });
    });
  };
}

export class Controller {
  @Post({ outputType: Hello })
  public getHello(): Hello {
    return {
      name: "name",
      address: "address",
    };
  }

  @Post({ outputType: List(Hello) })
  public getHelloList(): Hello[] {
    return [
      {
        name: "name",
        address: "address",
      },
    ];
  }

  @Post({ outputType: Tuple(Hello, String, Number) })
  public getHelloTuple(): [Hello, string, number] {
    return [
      {
        name: "name",
        address: "address",
      },
      "hello",
      1,
    ];
  }

  @Post({ outputType: Union(Orange, Apple, JackFruit) })
  public getHelloUnion(): Orange | Apple | JackFruit {
    return {
      __typename: "Orange",
      ripeness: "ripe",
      tang: "tangy",
    };
  }

  @Post({ outputType: Union(Hello, String) })
  public getHelloUnion(): Hello | string {
    return {
      name: "name",
      address: "address",
    };
  }
}

const c = new Controller();
c.getHello();
