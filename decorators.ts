// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import { assert } from "@std/assert";
import { getClassKey, type Injectable, registerClass } from "./kernel.ts";
import type { ClassType, MaybePromise } from "./utils.ts";

export interface ControllerMetadata {
  path: string;
}
export const controllers = new Map<symbol, ControllerMetadata>();

export function Controller(path: `/${string}`) {
  function controllerDecorator(
    target: ClassType<Injectable>,
    _context: ClassDecoratorContext,
  ): void {
    const key = registerClass(target);
    controllers.set(key, { path });
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
  propertyName: string | symbol;
  // TODO: define better args
  // handler(...args: unknown[]): MaybePromise<unknown>;
}

export const routes = new Map<symbol, RouteMetadata>();

export function Get<R>(options: GetOptions<R>) {
  return function get<T extends (...args: unknown[]) => MaybePromise<R>>(
    _target: T,
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
        controller: classKey,
        propertyName: methodName,
      });
    });
  };
}
