// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import { assert, assertExists } from "@std/assert";

// TODO: move to utils

// Acceptable function definition
// deno-lint-ignore no-explicit-any
export type ClassType<T = any> = new (...args: any[]) => T;

export type MaybeClassType<T> = ClassType<T> | T;

export type MaybePromise<T> = T;

export interface ControllerMetadata {
  path: string;
}

const typeKey = Symbol("api.type.key");
function registerClass<Class extends ClassType>(
  target: Class,
): symbol {
  const key = Symbol(target.name);
  Object.assign(target, { [typeKey]: key });
  return key;
}
function getClassKey(target: unknown): symbol {
  const key = (target as Record<symbol, symbol | undefined>)[typeKey];
  assertExists(
    key,
    `Cannot get class key: ${
      (target as ClassType).name
    } has not been registered`,
  );
  return key;
}

export const controllers = new Map<symbol, ControllerMetadata>();

export function Controller(path: `/${string}`) {
  function controllerDecorator(
    target: ClassType,
    _context: ClassDecoratorContext,
  ): void {
    const key = registerClass(target);
    controllers.set(key, { path });
    // for (const propertyName of Object.getOwnPropertyNames(target.prototype)) {
    // 	const descriptor = Object.getOwnPropertyDescriptor(
    // 		target.prototype,
    // 		propertyName,
    // 	);
    // 	if (
    // 		propertyName !== "constructor" &&
    // 		descriptor &&
    // 		shouldMonitorMethod(propertyName, options?.allowedMethods)
    // 	) {
    // 		const monitorMethod = new MonitorMethod(
    // 			{
    // 				methodName: propertyName,
    // 				className: options?.className ?? target.name,
    // 				tracerName: options?.tracerName,
    // 				spanKind: options?.spanKind,
    // 			},
    // 			descriptor.value,
    // 		);
    // 		descriptor.value = monitorMethod.build();
    // 		Object.defineProperty(target.prototype, propertyName, descriptor);
    // 	}
    // }
  }
  return controllerDecorator;
}

export interface GetOptions<R> {
  path: `/${string}`;
}

// TODO: enum
export type HttpMethod = "GET";

export interface RouteMetadata {
  method: HttpMethod;
  path: `/${string}`;
  controller: symbol;
  // TODO: define better args
  handler(...args: unknown[]): MaybePromise<unknown>;
}

export const routes = new Map<symbol, RouteMetadata>();

export function Get<R>(options: GetOptions<R>) {
  return function get<T extends (...args: unknown[]) => MaybePromise<R>>(
    target: T,
    context: ClassMethodDecoratorContext,
  ): void {
    const methodName = context.name;
    context.addInitializer(function (this: unknown) {
      const thisArg = this as ClassType;
      const className = thisArg.constructor.name;
      const classKey = getClassKey(thisArg.constructor);
      const methodSlug = `${className}.${String(methodName)}`;
      const key = Symbol(methodSlug);
      assert(
        !context.private,
        `'Get' cannot decorate private property: ${methodSlug}`,
      );
      routes.set(key, {
        method: "GET",
        path: options.path,
        handler: target,
        controller: classKey,
      });
    });
  };
}
