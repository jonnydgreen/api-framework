// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assert, AssertionError } from "@std/assert";

/**
 * Asserts that a provided input is never actually passed.
 * This is useful when ensuring that all cases have been used.
 * @param _input The input (that should never be passed)
 * @param message A custom message to use when an input is passed
 * @returns Nothing
 */
export function assertNever(
  _input: never,
  message: string,
): never {
  throw new AssertionError(message);
}

/**
 * Asserts that an input is a function
 * @param input The input to check
 * @param message A custom message to use when the input is not a function
 */
export function assertFunction(
  input: unknown,
  message?: string,
): asserts input is Fn {
  assert(
    typeof input === "function",
    message || `Input ${input} is not a function`,
  );
}

/**
 * A class type definition
 */
// Acceptable class type definition
// deno-lint-ignore no-explicit-any
export type ClassType<T = any> = new (...args: any[]) => T;

/**
 * A type definition that may or may not be a class type.
 */
export type MaybeClassType<T> = ClassType<T> | T;

/**
 * A type definition that may or may not be promise.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * A generic function type definition.
 */
// Acceptable function type definition
// deno-lint-ignore no-explicit-any
export type Fn = (...args: any[]) => any;
