// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import { assert, assertExists } from "@std/assert";
import {
  ClassRegistrationType,
  getRegistrationKey,
  type Injectable,
  registerClass,
} from "./registration.ts";
import { HttpMethod, type RoutePath } from "./router.ts";
import type { ClassType, MaybePromise } from "./utils.ts";
import type { Context } from "./context.ts";

/**
 * The controller metadata returned by {@linkcode getControllerMetadataByRoute}.
 */
export interface ControllerMetadata {
  /**
   * The path of the controller.
   */
  path: string;
}

const controllers = new Map<symbol, ControllerMetadata>();

/**
 * Get controller metadata by route.
 *
 * If no controller is found, an error will be thrown.
 * @param route The route metadata used to find the controller.
 * @returns The found controller.
 */
export function getControllerMetadataByRoute(
  route: RouteMetadata,
): ControllerMetadata {
  const controller = controllers.get(route.controller);
  assertExists(
    controller,
    `Controller ${
      String(route.controller)
    } does not exist for route: ${route.method} ${route.path}`,
  );
  return controller;
}

const routes = new Map<symbol, RouteMetadata>();

/**
 * Get route metadata by controller key.
 */
export function getRouteMetadataByController(
  controllerKey: symbol,
): RouteMetadata[] {
  return [...routes.values()].filter((route) =>
    route.controller === controllerKey
  );
}

/**
 * Register a Controller with the provided options for the class.
 *
 * This will be available to use within the DI framework.
 *
 * Typically, a controller will govern the defined resource indicated by the path.
 *
 * @param path The base path of the controller. Note, this should not include the version,
 * this is separately registered for groups of controllers in `Application.registerVersion`.
 * @returns a decorator that will register the controller.
 */
export function Controller(path: RoutePath): InjectableDecorator {
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

/**
 * Register a Service for use within the DI framework.
 *
 * @returns a decorator that will register the service.
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

/**
 * The route metadata storing all the necessary route information as
 * returned by {@linkcode getRouteMetadataByController}.
 */
export interface RouteMetadata {
  /**
   * The HTTP method of the route.
   */
  method: HttpMethod;
  /**
   * The URL path of the route.
   */
  path: RoutePath;
  /**
   * The registered controller key of the route.
   */
  controller: symbol;
  /**
   * The class method name for the registered route that
   * will be used as the route handler.
   */
  methodName: string | symbol;
  /**
   * The request body type key associated with the registered route.
   */
  body?: symbol;
}

/**
 * Register a GET route with the provided options for the class method.
 *
 * Note, this will not work for private or static properties.
 *
 * @param options The options for registering a GET route.
 * @returns a decorator that will register the GET route
 */
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
        !context.private && !context.static,
        `'Get' cannot decorate private property: ${methodSlug}`,
      );
      if (!routes.has(key)) {
        routes.set(key, {
          method: HttpMethod.GET,
          path: options.path,
          controller: classKey,
          methodName: methodName,
        });
      }
    });
  };
}

/**
 * Options for registering a GET request with the {@linkcode Get} decorator.
 */
export interface GetOptions<ResponseType> {
  /**
   * The path to register the GET route for.
   * This will be prefixed by the controller path.
   */
  path: RoutePath;
}

/**
 * The GET method for the {@linkcode Get} decorator.
 *
 * All the parameters will be included in each incoming {@linkcode Request}.
 */
export type GetDecoratorTarget<
  ResponseType,
> = (
  ctx: Context,
  params: unknown,
) => MaybePromise<ResponseType>;

/**
 * The GET method decorator for the {@linkcode Get} decorator.
 */
export type GetMethodDecorator<ResponseType> = (
  target: GetDecoratorTarget<ResponseType>,
  context: ClassMethodDecoratorContext,
) => void;

// TODO(jonnydgreen): examples
/**
 * Register a POST route with the provided options for the class method.
 *
 * Note, this will not work for private or static properties.
 *
 * @param options The options for registering a POST route.
 * @returns a decorator that will register the POST route
 */
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
        !context.private && !context.static,
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
          methodName: methodName,
          body,
        });
      }
    });
  };
}

/**
 * Options for registering a POST request with the {@linkcode Post} decorator.
 */
export interface PostOptions<
  RequestBody = unknown,
  ResponseType = unknown,
> {
  /**
   * The path to register the POST route for.
   * This will be prefixed by the controller path.
   */
  path: RoutePath;
  /**
   * The request body type of the POST route.
   */
  body?: RequestBody;
  /**
   * The response type of the POST route.
   */
  response?: ResponseType;
}

/**
 * The POST method for the {@linkcode Post} decorator.
 *
 * All the parameters will be included in each incoming {@linkcode Request}.
 */
export type PostDecoratorTarget<
  RequestBody,
  ResponseType,
> = (
  ctx: Context,
  params: unknown,
  body: RequestBody,
) => MaybePromise<ResponseType>;

/**
 * The POST method decorator for the {@linkcode Post} decorator.
 */
export type PostMethodDecorator<RequestBody, ResponseType> = (
  target: PostDecoratorTarget<RequestBody, ResponseType>,
  context: ClassMethodDecoratorContext,
) => void;
