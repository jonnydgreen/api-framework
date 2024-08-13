// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import "npm:reflect-metadata";
import {
  Container as InversifyContainer,
  decorate,
  inject,
  injectable,
  type interfaces,
} from "inversify";
import { assertFunction, type ClassType, type Fn } from "./utils.ts";
import type { ServerContext } from "./context.ts";
import {
  ClassRegistrationType,
  getClassRegistrations,
  getRegistrationKey,
  runRegistration,
} from "./registration.ts";

// TODO(jonnydgreen): make our own container
/**
 * The container of all injectables that can be used in the DI framework.
 */
export type Container = InversifyContainer;

interface IMetadata {
  injectable: Record<string, boolean>;
  inject: Record<string, unknown>;
}

const metadata: IMetadata = {
  injectable: {},
  inject: {},
};

/**
 * Make an injectable target by decorating the target with necessary metadata
 * @param target The target to make an injectable
 */
function makeInjectable(target: ClassType): void {
  decorate(injectable(), target);
}

/**
 * Register a singleton for a given target and dependencies.
 *
 * First, the target is registered, then the dependencies are registered with this class.
 * Once complete, the target is bound to the given symbol as a singleton. A.k.a only
 * instantiated once for the lifetime of the container.
 *
 * @param container
 * @param type
 * @param target
 * @param types
 * @returns
 */
function registerSingleton<T>(
  container: Container,
  type: symbol,
  target: ClassType<T>,
  ...types: symbol[]
): interfaces.BindingWhenOnSyntax<T> {
  if (!metadata.injectable[target.name]) {
    makeInjectable(target);
    metadata.injectable[target.name] = true;
  }
  let index = 0;
  for (const type of types) {
    const injectKey = `${target.name}.${index}`;
    if (typeof metadata.inject[injectKey] === "undefined") {
      decorate(inject(type) as ParameterDecorator, target, index++);
      metadata.inject[injectKey] = true;
    }
  }
  return container.bind<T>(type).to(target).inSingletonScope();
}

/**
 * Build the {@linkcode Container} by running the registrations for each registered class.
 *
 * If a registration is unsupported, an error will be thrown.
 *
 * @param ctx The server context.
 * @returns The built container
 */
export async function buildContainer(ctx: ServerContext): Promise<Container> {
  ctx.log.debug("Building server container");
  const container = new InversifyContainer();
  for (
    const [key, { target }] of getClassRegistrations(
      ClassRegistrationType.Injectable,
    )
  ) {
    ctx.log.debug(
      `Registering ${key.description} in the container`,
    );
    const { dependencies } = await runRegistration(ctx, target);
    const paramKeys = dependencies.map((c, idx) => {
      if (c.class) {
        return getRegistrationKey(c.class);
      }
      throw new ContainerError(
        `Unable to register ${key.description}: unsupported parameter definition at position ${idx}`,
      );
    });
    registerSingleton(container, key, target, ...paramKeys);
    ctx.log.debug(
      `Registered ${key.description} in the container`,
    );
  }
  ctx.log.debug("Built server container");
  return container;
}

/**
 * A container error that can be throw when building the container in {@linkcode buildContainer}.
 */
export class ContainerError extends Error {
  /**
   * The name of the error.
   */
  override readonly name = "ContainerError";
}

/**
 * Setup the container class by instantiating it.
 * @param container The container containing the class to instantiate
 * @param target The class to instantiate. This must be registered within the system.
 * @typeParam T The class type of the container class to setup.
 */
export function setupContainerClass<T>(
  container: Container,
  target: ClassType<T>,
): void {
  const key = getRegistrationKey(target);
  container.get<T>(key);
}

/**
 * Get an instantiated class method from the built container.
 *
 * If not method exists, an error will be thrown.
 *
 * @param container The container to fetch the class method from.
 * @param targetKey The key of the instantiated class in the container.
 * @param methodName The method name of the instantiated class.
 * @typeParam T The class type of the container class method.
 * @returns The instantiated class method.
 *
 * @example Usage
 * ```ts no-eval
 * import { ServerContext, getContainerClassMethod, buildContainer } from "@eyrie/app";
 * import { assert } from "@std/assert";
 *
 * const ctx = new ServerContext("INFO");
 * const container = await buildContainer(ctx);
 * const method = getContainerClassMethod(container, Symbol("target"), "methodName");
 * assert(typeof method === "function");
 * ```
 */
export function getContainerClassMethod<T>(
  container: Container,
  targetKey: symbol,
  methodName: keyof T,
): Fn {
  const registeredTarget = container.get<T>(targetKey);
  const fn = registeredTarget[methodName];
  assertFunction(
    fn,
    `No method ${String(methodName)} exists for class: ${String(targetKey)}`,
  );
  return fn.bind(registeredTarget);
}

// TODO(jonnydgreen): move all bits to a class
