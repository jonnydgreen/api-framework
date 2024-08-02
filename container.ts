// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import "npm:reflect-metadata";
import {
  Container as InversifyContainer,
  decorate,
  inject,
  injectable,
  interfaces,
} from "@npm/inversify";
import { assertFunction, type ClassType, type Fn } from "./utils.ts";
import type { ServerContext } from "./context.ts";
import {
  getClassKey,
  getClassRegistration,
  getClassRegistrations,
} from "./registration.ts";

// TODO: make our own container
export type Container = InversifyContainer;

interface IMetadata {
  injectable: Record<string, boolean>;
  inject: Record<string, unknown>;
}

const metadata: IMetadata = {
  injectable: {},
  inject: {},
};

function makeInjectable(target: ClassType): void {
  decorate(injectable(), target);
}

export function registerSingleton<T>(
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

export async function buildContainer(ctx: ServerContext): Promise<Container> {
  ctx.log.debug("Building server container");
  const container = new InversifyContainer();
  for (const [key, target] of getClassRegistrations()) {
    ctx.log.debug(
      `Registering ${key.description} in the container`,
    );
    const { ctor } = await getClassRegistration(ctx, target);
    const paramKeys = ctor.map((c, idx) => {
      if (c.class) {
        return getClassKey(c.class);
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

export class ContainerError extends Error {
  override readonly name = "ContainerError";
}

export function registerContainerClassMethods<T>(
  container: Container,
  target: ClassType<T>,
): void {
  const key = getClassKey(target);
  container.get<T>(key);
}

export function getContainerClassMethod<T>(
  container: Container,
  targetKey: symbol,
  propertyName: keyof T,
): Fn {
  const registeredTarget = container.get<T>(targetKey);
  const fn = registeredTarget[propertyName];
  assertFunction(fn);
  return fn.bind(registeredTarget);
}

// TODO: move all bits to a class
