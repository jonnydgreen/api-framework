// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import { assert } from "@std/assert";
import {
  ClassRegistrationType,
  getRegistrationKey,
  type Injectable,
  registerClass,
} from "./registration.ts";
import { HttpMethod } from "./router.ts";
import type { ClassType, MaybePromise } from "./utils.ts";
import type { Context } from "./context.ts";

export interface ControllerMetadata {
  path: string;
}

export const controllers = new Map<symbol, ControllerMetadata>();
export const routes = new Map<symbol, RouteMetadata>();

export function Controller(path: `/${string}`): InjectableDecorator {
  function controllerDecorator(
    target: ClassType<Injectable>,
    _context: ClassDecoratorContext,
  ): void {
    const key = registerClass({
      type: ClassRegistrationType.Injectable,
      target,
    });
    controllers.set(key, { path });
  }
  return controllerDecorator;
}

export function Service(): InjectableDecorator {
  function serviceDecorator(
    target: ClassType<Injectable>,
    _context: ClassDecoratorContext,
  ): void {
    registerClass({ type: ClassRegistrationType.Injectable, target });
  }
  return serviceDecorator;
}

export type InjectableDecorator = (
  target: ClassType<Injectable>,
  _context: ClassDecoratorContext,
) => void;

export interface GetOptions<R> {
  path: `/${string}`;
}

export interface RouteMetadata {
  method: HttpMethod;
  path: `/${string}`;
  controller: symbol;
  propertyName: string | symbol;
  body?: symbol;
}

export type GetDecoratorTarget<
  ResponseType,
> = (
  ctx: Context,
  params: unknown,
) => MaybePromise<ResponseType>;

export type GetMethodDecorator<ResponseType> = (
  target: GetDecoratorTarget<ResponseType>,
  context: ClassMethodDecoratorContext,
) => void;

export function Get<ResponseType>(
  options: GetOptions<ResponseType>,
): GetMethodDecorator<ResponseType> {
  return function get(
    _target: GetDecoratorTarget<ResponseType>,
    context: ClassMethodDecoratorContext,
  ): void {
    const methodName = context.name;
    const key = Symbol(String(methodName));
    context.addInitializer(function (this: unknown) {
      const thisArg = this as ClassType;
      const className = thisArg.constructor.name;
      const methodSlug = `${className}.${String(methodName)}`;
      const classKey = getRegistrationKey(thisArg.constructor);
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

export interface PostOptions<
  RequestBody = unknown,
  ResponseType = unknown,
> {
  path: `/${string}`;
  body?: RequestBody;
  response?: ResponseType;
}

export type PostDecoratorTarget<
  RequestBody,
  ResponseType,
> = (
  ctx: Context,
  params: unknown,
  body: RequestBody,
) => MaybePromise<ResponseType>;

export type PostMethodDecorator<RequestBody, ResponseType> = (
  target: PostDecoratorTarget<RequestBody, ResponseType>,
  context: ClassMethodDecoratorContext,
) => void;

// TODO(jonnydgreen): examples
export function Post<RequestBody, ResponseType>(
  options: PostOptions<ClassType<RequestBody>, ResponseType>,
): PostMethodDecorator<RequestBody, ResponseType> {
  return function post(
    _target: PostDecoratorTarget<RequestBody, ResponseType>,
    context: ClassMethodDecoratorContext,
  ): void {
    const methodName = context.name;
    const key = Symbol(String(methodName));
    context.addInitializer(function (this: unknown) {
      const thisArg = this as ClassType;
      const className = thisArg.constructor.name;
      const methodSlug = `${className}.${String(methodName)}`;
      const classKey = getRegistrationKey(thisArg.constructor);
      assert(
        !context.private,
        `'Post' cannot decorate private property: ${methodSlug}`,
      );
      let body: symbol | undefined = undefined;
      if (options.body) {
        body = getRegistrationKey(options.body);
      }
      if (!routes.has(key)) {
        routes.set(key, {
          method: HttpMethod.POST,
          path: options.path,
          controller: classKey,
          propertyName: methodName,
          body,
        });
      }
    });
  };
}
