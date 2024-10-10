// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

/**
 * Asserts that a provided input is never actually passed.
 * This is useful when ensuring that all cases have been used.
 * @param _input The input (that should never be passed)
 * @param error The error to throw when an input is passed
 * @returns Nothing
 *
 * @example Usage
 * ```ts no-assert
 * import { assertNever } from "@eyrie/app"
 *
 * enum Hello {
 *   Hi,
 *   Ahoy,
 * }
 *
 * const input = Hello.Hi as Hello;
 * switch (input) {
 *   case Hello.Hi: {
 *     break;
 *   }
 *   case Hello.Ahoy: {
 *     break;
 *   }
 *   default: {
 *     assertNever(input, new Error("Should never reach here")); // Errors at compile time
 *   }
 * }
 * ```
 */
export function assertNever(
  _input: never,
  error: Error,
): never {
  throw error;
}

/**
 * Determines whether the input exists or not.
 * @param actual The input
 * @typeParam T The type of the input
 * @returns Indicator for whether the input exists
 * @example Usage
 * ```ts
 * import { assert } from "@std/assert";
 * import { exists } from "@eyrie/app";
 *
 * const doesNotExist = exists(undefined);
 * const doesExist = exists("hello");
 * assert(!doesNotExist);
 * assert(doesExist);
 * ```
 */
export function exists<T>(actual: T): actual is NonNullable<T> {
  return !(actual === undefined || actual === null);
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
