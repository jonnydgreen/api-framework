// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import "reflect-metadata";
import {
  Container as InversifyContainer,
  decorate,
  inject,
  injectable,
} from "inversify";
import { assertFunction, type ClassType, type Fn } from "./utils.ts";
import type { ServerContext } from "./context.ts";
import {
  ClassRegistrationType,
  getClassRegistrations,
  getRegistrationDefinition,
  getRegistrationKey,
} from "./registration.ts";

/**
 * The container of all injectables that can be used in the DI framework.
 *
 * @example Usage
 * ```ts no-assert
 * import { Container, ServerContext } from "@eyrie/app";
 * import { assert } from "@std/assert";
 *
 * const ctx = new ServerContext("INFO");
 *
 * const container = new Container()
 * await container.build(ctx)
 * ```
 */
export class Container {
  #container: InversifyContainer;

  constructor() {
    this.#container = new InversifyContainer();
  }

  /**
   * Build the {@linkcode Container} by running the registrations for each registered class.
   *
   * If a registration is unsupported, an error will be thrown.
   *
   * @param ctx The server context.
   * @returns The built container
   * @example Usage
   * ```ts no-assert
   * import { Container, ServerContext } from "@eyrie/app";
   * import { assert } from "@std/assert";
   *
   * const ctx = new ServerContext("INFO");
   *
   * const container = new Container()
   * await container.build(ctx)
   * ```
   */
  async build(ctx: ServerContext): Promise<void> {
    ctx.log.debug("Building server container");
    for (
      const [key, { target }] of getClassRegistrations(
        ClassRegistrationType.Injectable,
      )
    ) {
      ctx.log.debug(
        `Registering ${key.description} in the container`,
      );
      const { dependencies } = await getRegistrationDefinition(ctx, target);
      const paramKeys = dependencies.map((c, idx) => {
        if (c.class) {
          return getRegistrationKey(c.class);
        }
        throw new ContainerError(
          `Unable to register ${key.description}: unsupported parameter definition at position ${idx}`,
        );
      });
      this.#registerSingleton(key, target, ...paramKeys);
      ctx.log.debug(
        `Registered ${key.description} in the container`,
      );
    }
    ctx.log.debug("Built server container");
  }

  /**
   * Setup the container class by instantiating it.
   * @param target The class to instantiate. This must be registered within the system.
   * @typeParam T The class type of the container class to setup.
   * @example Usage
   * ```ts no-assert
   * import { Container, ServerContext, registerClass, ClassRegistrationType } from "@eyrie/app";
   * import { MessageController } from "./examples/basic/basic_controller.ts";
   *
   * const type = ClassRegistrationType.Injectable;
   * const target = MessageController;
   * const ctx = new ServerContext("INFO");
   * registerClass({ type, target });
   *
   * const container = new Container()
   * await container.build(ctx)
   * container.setupClass(target)
   * ```
   */
  setupClass<T>(
    target: ClassType<T>,
  ): void {
    const key = getRegistrationKey(target);
    this.#container.get<T>(key);
  }

  /**
   * Get an instantiated class method from the built container.
   * This is intended for internal use only.
   *
   * If not method exists, an error will be thrown.
   *
   * @param targetKey The key of the instantiated class in the container.
   * @param methodName The method name of the instantiated class.
   * @typeParam T The class type of the container class method.
   * @returns The instantiated class method.
   * @tags internal
   * @example Usage
   * ```ts
   * import { Container, ServerContext, registerClass, ClassRegistrationType, getRegistrationKey } from "@eyrie/app";
   * import { assert } from "@std/assert";
   * import { MessageController } from "@examples/basic/basic_controller.ts";
   *
   * const type = ClassRegistrationType.Injectable;
   * const target = MessageController;
   * const ctx = new ServerContext("INFO");
   * registerClass({ type, target });
   * const container = new Container()
   * await container.build(ctx)
   * const targetKey = getRegistrationKey(target)
   *
   * const fn = container.getClassMethod(targetKey, "getMessages")
   * const result = fn()
   * assert(result.length);
   * ```
   */
  getClassMethod<T>(
    targetKey: symbol,
    methodName: keyof T,
  ): Fn {
    const registeredTarget = this.#container.get<T>(targetKey);
    const fn = registeredTarget[methodName];
    assertFunction(
      fn,
      `No method ${String(methodName)} exists for class: ${String(targetKey)}`,
    );
    return fn.bind(registeredTarget);
  }

  /**
   * Register a singleton for a given target and dependencies.
   *
   * First, the target is registered, then the dependencies are registered with this class.
   * Once complete, the target is bound to the given symbol as a singleton. A.k.a only
   * instantiated once for the lifetime of the container.
   * @param token The token to bind
   * @param target The target to bind to
   * @param dependencyTokens The tokens to bind as dependencies
   * @returns
   */
  #registerSingleton<T>(
    token: symbol,
    target: ClassType<T>,
    ...dependencyTokens: symbol[]
  ): void {
    if (!_containerMetadata.injectable.has(target.name)) {
      this.#makeInjectable(target);
      _containerMetadata.injectable.set(target.name, true);
    }
    let index = 0;
    for (const type of dependencyTokens) {
      const injectKey = `${target.name}.${index}`;
      if (typeof _containerMetadata.inject.get(injectKey) === "undefined") {
        decorate(inject(type) as ParameterDecorator, target, index++);
        _containerMetadata.inject.set(injectKey, true);
      }
    }
    this.#container.bind<T>(token).to(target).inSingletonScope();
  }

  /**
   * Make an injectable target by decorating the target with necessary metadata
   * @param target The target to make an injectable
   */
  #makeInjectable(target: ClassType): void {
    decorate(injectable(), target);
  }
}

/**
 * A container error that can be throw when building the container in {@linkcode buildContainer}.
 * @example Usage
 * ```ts
 * import { ContainerError } from "@eyrie/app";
 * import { assert } from "@std/assert";
 *
 * const error = new ContainerError()
 * assert(error instanceof Error);
 * assert(typeof error.message === "string");
 * ```
 */
export class ContainerError extends Error {
  /**
   * The name of the error.
   * @example Usage
   * ```ts
   * import { ContainerError } from "@eyrie/app";
   * import { assert } from "@std/assert";
   *
   * const error = new ContainerError()
   * assert(error.name === "ContainerError");
   * ```
   */
  override readonly name = "ContainerError";
}

interface ContainerMetadata {
  injectable: Map<string, boolean>;
  inject: Map<string, unknown>;
}
/**
 * Used to store which injectables and dependencies have been decorated.
 * This allows one to run {@linkcode Container.build} multiple times in
 * one process.
 */
const _containerMetadata: ContainerMetadata = {
  injectable: new Map(),
  inject: new Map(),
};
