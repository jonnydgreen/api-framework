// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: refine docs and error

import { assert, AssertionError } from "@std/assert";

export function assertNever(
  _input: never,
  msg: string,
): never {
  throw new AssertionError(msg);
}

export function assertFunction(
  input: unknown,
  msg?: string,
): asserts input is Fn {
  assert(
    typeof input === "function",
    msg || `Input ${input} is not a function`,
  );
}

// Acceptable class type definition
// deno-lint-ignore no-explicit-any
export type ClassType<T = any> = new (...args: any[]) => T;

export type MaybeClassType<T> = ClassType<T> | T;

export type MaybePromise<T> = T | Promise<T>;

// Acceptable function type definition
// deno-lint-ignore no-explicit-any
export type Fn = (...args: any[]) => any;
