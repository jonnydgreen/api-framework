// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import { assert } from "@std/assert";
import { getClassKey, type Injectable, registerClass } from "./container.ts";
import type { ClassType, MaybePromise } from "./utils.ts";
import { HttpMethod } from "./router.ts";

export interface ControllerMetadata {
  path: string;
}

export const controllers = new Map<symbol, ControllerMetadata>();
export const routes = new Map<symbol, RouteMetadata>();

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

export function Service() {
  function serviceDecorator(
    target: ClassType<Injectable>,
    _context: ClassDecoratorContext,
  ): void {
    registerClass(target);
  }
  return serviceDecorator;
}

export interface GetOptions<R> {
  path: `/${string}`;
}

export interface RouteMetadata {
  method: HttpMethod;
  path: `/${string}`;
  controller: symbol;
  propertyName: string | symbol;
}

export function Get<R>(options: GetOptions<R>) {
  return function get<T extends (...args: unknown[]) => MaybePromise<R>>(
    _target: T,
    context: ClassMethodDecoratorContext,
  ): void {
    const methodName = context.name;
    const key = Symbol(String(methodName));
    context.addInitializer(function (this: unknown) {
      const thisArg = this as ClassType;
      const className = thisArg.constructor.name;
      const methodSlug = `${className}.${String(methodName)}`;
      const classKey = getClassKey(thisArg.constructor);
      assert(
        !context.private,
        `'Get' cannot decorate private property: ${methodSlug}`,
      );
      if (!routes.has(key)) {
        routes.set(key, {
          method: HttpMethod.GET,
          path: options.path,
          controller: classKey,
          propertyName: methodName,
        });
      }
    });
  };
}
