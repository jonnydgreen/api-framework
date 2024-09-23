// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import type { ServerContext } from "./context.ts";
import { type ClassType, exists, type MaybePromise } from "./utils.ts";

const registerFnName = "register";

/**
 * Get the registration definition of an injectable to fully register it within the
 * system and make it ready to be used.
 *
 * An assertion error will be thrown if the class
 * has not been correctly registered.
 *
 * @param ctx Server Context
 * @param target The class to run the registration for.
 * @returns Registration definition
 * @example Usage
 * ```ts
 * import { getRegistrationDefinition, ServerContext } from "@eyrie/app";
 * import { assertExists } from "@std/assert";
 * import { MessageController } from "@examples/basic/basic_controller.ts";
 *
 * const ctx = new ServerContext("INFO");
 * const registration = await getRegistrationDefinition(ctx, MessageController);
 * assertExists(registration.dependencies);
 * ```
 */
export function getRegistrationDefinition(
  ctx: ServerContext,
  target: ClassType,
): InjectableRegistration | Promise<InjectableRegistration> {
  const descriptor = Object.getOwnPropertyDescriptor(
    target.prototype,
    registerFnName,
  );
  if (typeof descriptor?.value !== "function") {
    throw new RegistrationError(
      `No registration function ${registerFnName}() defined for injectable: ${target.name}`,
    );
  }
  return descriptor.value(ctx);
}

const classRegistrations = new Map<symbol, ClassRegistration>();

/**
 * The class registration type. This is predominantly used to allow
 * one to select groups of registrations to be used for different
 * purposes.
 */
export const enum ClassRegistrationType {
  Injectable = "Injectable",
  ObjectType = "ObjectType",
  InputType = "InputType",
}

/**
 * A class registration. These are available to be used
 * throughout the system such as within the DI framework.
 */
export interface ClassRegistration {
  /**
   * The type of the class registration.
   */
  type: ClassRegistrationType;
  /**
   * The target of the class registration.
   */
  target: ClassType;
}

/**
 * Get all of the class registrations.
 *
 * If specified, the type param ({@linkcode ClassRegistrationType}) is used to filter down the results
 * by the specified type.
 *
 * @param type The optional type of class registrations to fetch by.
 * @returns The class registrations and their key as an array of tuples
 * @example Usage
 * ```ts no-eval
 * import { getClassRegistrations, ClassRegistrationType } from "@eyrie/app";
 * import { assert } from "@std/assert";
 *
 * const registrations = getClassRegistrations(ClassRegistrationType.Injectable);
 * assert(registrations.length);
 * ```
 */
export function getClassRegistrations(
  type: ClassRegistrationType,
): [symbol, ClassRegistration][] {
  return [...classRegistrations.entries()].filter(([, r]) => r.type === type);
}

const typeKey = Symbol("class.type.key");

/**
 * Register a class within the system. Once registered, this will available to be used
 * throughout the system such as within the DI framework.
 *
 * At the moment, only classes can be registered.
 *
 * @param type The type of registration. This allows one to use a class for specific purposes.
 * @param target The target to register.
 * @returns The symbol used to register the class
 * @example Usage
 * ```ts
 * import { registerClass, ClassRegistrationType } from "@eyrie/app";
 * import { assert } from "@std/assert";
 * import { Message } from "@examples/basic/basic_model.ts";
 *
 * const type = ClassRegistrationType.ObjectType;
 * const target = Message;
 * const key = registerClass({ type, target });
 * assert(typeof key === 'symbol');
 * ```
 */
export function registerClass(
  { type, target }: ClassRegistration,
): symbol {
  const key = Symbol(target.name);
  Object.assign(target, { [typeKey]: key });
  classRegistrations.set(key, { type, target });
  return key;
}

/**
 * Get the class registration by key. If no class registration can
 * be found for the provided key, then an error is thrown.
 *
 * @param key The registration to find the class registration with.
 * @returns The class registration
 * @example Usage
 * ```ts
 * import { getClassRegistrationByKey, registerClass, ClassRegistrationType } from "@eyrie/app";
 * import { assertExists } from "@std/assert";
 * import { Message } from "@examples/basic/basic_model.ts";
 *
 * const type = ClassRegistrationType.ObjectType;
 * const target = Message;
 * const key = registerClass({ type, target });
 *
 * const classRegistration = getClassRegistrationByKey(key);
 * assertExists(classRegistration);
 * ```
 */
export function getClassRegistrationByKey(key: symbol): ClassRegistration {
  const target = classRegistrations.get(key);
  if (!exists(target)) {
    throw new RegistrationError(
      `Class is not registered for key: ${key.description}`,
    );
  }
  return target;
}

// TODO: get rid of assertions as it's a bit of an anti-pattern to use them in functional code:
//  - Assertions are used to find programming errors. Your programs must work just as well when all assertions are removed.
//  - Exceptions, on the other hand, are for situations that can happen even when the program is perfect; they are caused by external influences, like hardware, network, users etc.

// TODO(jonnydgreen): add a concepts page for all of this code, specifically registrations etc
// TODO: some of this is DI specific so move this there
/**
 * Get the registration key of the target.
 * If no key is found, then an error is thrown.
 *
 * @param target The target to get the key from
 * @returns The key
 * @example Usage
 * ```ts
 * import { getRegistrationKey, registerClass, ClassRegistrationType } from "@eyrie/app";
 * import { assert } from "@std/assert";
 * import { Message } from "@examples/basic/basic_model.ts";
 *
 * const type = ClassRegistrationType.ObjectType;
 * const target = Message;
 * const key = registerClass({ type, target });
 *
 * const foundKey = getRegistrationKey(Message);
 * assert(foundKey === key);
 * ```
 */
export function getRegistrationKey(target: unknown): symbol {
  const key = maybeGetRegistrationKey(target);
  if (!exists(key)) {
    throw new RegistrationError(
      `Cannot get class key: ${
        (target as ClassType).name
      } has not been registered`,
    );
  }
  return key;
}

/**
 * Attempt to get the registration key of the target.
 * If no key is found, then undefined is returned.
 *
 * @param target The target to get the key from
 * @returns The key (if found)
 * @example Usage
 * ```ts
 * import { maybeGetRegistrationKey, registerClass, ClassRegistrationType } from "@eyrie/app";
 * import { assert, assertExists } from "@std/assert";
 * import { Message } from "@examples/basic/basic_model.ts";
 *
 * const type = ClassRegistrationType.ObjectType;
 * const target = Message;
 * const key = registerClass({ type, target });
 *
 * const foundKey = maybeGetRegistrationKey(Message);
 * assertExists(foundKey);
 * assert(foundKey === key);
 * ```
 */
export function maybeGetRegistrationKey(target: unknown): symbol | undefined {
  return (target as Record<symbol, symbol | undefined>)[typeKey];
}

/**
 * A dependency registration definition that is used to register the
 * dependencies of a class. These are defined in the class constructor.
 *
 * At the moment the following types of dependencies are supported:
 *  - `class`
 */
export interface DependencyRegistration {
  /**
   * A class dependency registration. This must be an {@linkcode Injectable}
   * type class to be successfully registered.
   */
  class?: ClassType<Injectable>;
}

/**
 * The registration definition that is used to fully register am injectable
 * class within the DI framework.
 */
// TODO(jonnydgreen): move to container as it's DI
export interface InjectableRegistration {
  /**
   * The registration definitions of the class to register. These are passed in
   * via the injectable class constructor.
   */
  dependencies: DependencyRegistration[];
}

// TODO(jonnydgreen): move to container as it's DI
/**
 * An instance (or injectable) that can be registered and subsequently
 * used by the dependency injection framework.
 */
export interface Injectable {
  // TODO(jonnydgreen): maybe name to init?
  /**
   * The registration method that is used to register the associated class
   * with the DI container. This can optionally be a promise for async registration
   * tasks.
   *
   * @param ctx The application server context made available to the registration method.
   */
  register(ctx: ServerContext): MaybePromise<InjectableRegistration>;
}

/**
 * A registration error that can be thrown when registering classes for use
 * throughout the system.
 *
 * @example Usage
 * ```ts
 * import { RegistrationError } from "@eyrie/app";
 * import { assert } from "@std/assert";
 *
 * const error = new RegistrationError()
 * assert(error instanceof Error);
 * assert(typeof error.message === "string");
 * ```
 */
export class RegistrationError extends Error {
  /**
   * The name of the error.
   * @example Usage
   * ```ts
   * import { RegistrationError } from "@eyrie/app";
   * import { assert } from "@std/assert";
   *
   * const error = new RegistrationError()
   * assert(error.name === "RegistrationError");
   * ```
   */
  override readonly name = "RegistrationError";
}

/**
 * Register a Service for use within the DI framework.
 *
 * @returns a decorator that will register the service.
 * @example Usage
 * ```ts no-assert
 * import { Service, Injectable, InjectableRegistration } from "@eyrie/app";
 *
 * @Service()
 * class MessageService implements Injectable {
 *   register(): InjectableRegistration {
 *     return { dependencies: [] };
 *   }
 *   public getMessages(): string[] {
 *     return ["Hello", "Hiya"];
 *   }
 * }
 * ```
 */
export function Service(): InjectableDecorator {
  function serviceDecorator(
    target: ClassType<Injectable>,
    _context: ClassDecoratorContext,
  ): void {
    registerClass({ type: ClassRegistrationType.Injectable, target });
  }
  return serviceDecorator;
}

/**
 * The required shape of classes decorated by the {@linkcode Service}
 * and the {@linkcode Controller} decorators.
 */
export type InjectableDecorator = (
  target: ClassType<Injectable>,
  _context: ClassDecoratorContext,
) => void;
