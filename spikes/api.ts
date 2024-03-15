#!/usr/bin/env deno run

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

export interface PostOptions<R> {
  outputType: MaybeClassType<R>;
  isArray?: boolean;
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
    return [{
      name: "name",
      address: "address",
    }];
  }

  @Post({ outputType: Tuple(Hello, String) })
  public getHelloTuple(): [Hello, string] {
    return [{
      name: "name",
      address: "address",
    }, "hello"];
  }
}

const c = new Controller();
c.getHello();
