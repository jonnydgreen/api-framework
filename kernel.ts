// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import "npm:reflect-metadata";
import {
  Container,
  decorate,
  inject,
  injectable,
  interfaces,
} from "@npm/inversify";
import { assert, assertExists } from "@std/assert";
import { assertFunction, type ClassType, type Fn } from "./utils.ts";
import { ServerContext } from "./logger.ts";

export type Kernel = Container;

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

export function register<T>(
  container: Kernel,
  type: symbol,
  target: ClassType<T>,
  ...types: symbol[]
): interfaces.BindingInWhenOnSyntax<T> {
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
  return container.bind<T>(type).to(target);
}

const classRegistrations = new Map<symbol, ClassType>();

const typeKey = Symbol("api.type.key");
export function registerClass<Class extends ClassType>(
  target: Class,
): symbol {
  const key = Symbol(target.name);
  Object.assign(target, { [typeKey]: key });
  classRegistrations.set(key, target);
  return key;
}
export function getClassKey(target: unknown): symbol {
  const key = (target as Record<symbol, symbol | undefined>)[typeKey];
  assertExists(
    key,
    `Cannot get class key: ${
      (target as ClassType).name
    } has not been registered`,
  );
  return key;
}

export interface Registration {
  class?: ClassType<Injectable>;
}

export interface InjectableRegistration {
  ctor: Registration[];
}

const registerFnName = "register";
export interface Injectable {
  // TODO: maybe name to init?
  register(): InjectableRegistration | Promise<InjectableRegistration>;
}

export function assertInjectable(
  target: ClassType,
): asserts target is ClassType<Injectable> {
  const descriptor = Object.getOwnPropertyDescriptor(
    target.prototype,
    registerFnName,
  );
  assert(
    typeof descriptor?.value === "function",
    `No registration function ${registerFnName}() defined for injectable: ${target}`,
  );
}

function getClassRegistration(
  target: ClassType,
): InjectableRegistration | Promise<InjectableRegistration> {
  const descriptor = Object.getOwnPropertyDescriptor(
    target.prototype,
    registerFnName,
  );
  assertFunction(
    descriptor?.value,
    `No registration function ${registerFnName}() defined for injectable: ${target}`,
  );
  return descriptor.value();
}

export async function buildKernel(ctx: ServerContext): Promise<Kernel> {
  ctx.log.debug("Building server kernel");
  const kernel = new Container();
  for (const [key, target] of classRegistrations.entries()) {
    ctx.log.debug(
      `Registering ${key.description} in the kernel`,
    );
    const { ctor } = await getClassRegistration(target);
    const paramKeys = ctor.map((c, idx) => {
      if (typeof c === "function") {
        return getClassKey(c);
      }
      if (c.class) {
        return getClassKey(c.class);
      }
      throw new KernelError(
        `Unable register to register ${key.description}: unsupported parameter definition at position ${idx}`,
      );
    });
    register(kernel, key, target, ...paramKeys);
  }
  ctx.log.debug("Built server kernel");
  return kernel;
}

export class KernelError extends Error {
  override readonly name = "KernelError";
}

export function registerClassMethods<T>(
  kernel: Kernel,
  target: ClassType<T>,
): void {
  const key = getClassKey(target);
  kernel.get<T>(key);
}

export function getClassMethod<T>(
  kernel: Kernel,
  targetKey: symbol,
  propertyName: keyof T,
): Fn {
  const registeredTarget = kernel.get<T>(targetKey);
  const fn = registeredTarget[propertyName];
  assertFunction(fn);
  return fn.bind(registeredTarget);
}

// TODO: move to class
