// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { STATUS_CODE, type StatusCode } from "@std/http";
import { join } from "@std/path/join";
import type { Container } from "./container.ts";
import type { Context } from "./context.ts";
import {
  ClassRegistrationType,
  getClassRegistrationByKey,
  getRegistrationKey,
  type Injectable,
  registerClass,
} from "./registration.ts";
import { buildErrorResponse, processResponse } from "./response.ts";
import { type ClassType, exists, type MaybePromise } from "./utils.ts";

const controllers = new Map<symbol, ControllerMetadata>();
const routes = new Map<symbol, RouteMetadata>();

/**
 * The controller metadata used to build the router in {@linkcode registerController}.
 */
export interface ControllerMetadata {
  /**
   * The path of the controller.
   */
  path: string;
}

/**
 * The route metadata storing all the necessary route information
 * and used to build the router in {@linkcode registerRoute}.
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
 * Build the controller routes for a specified version.
 *
 * This fetches the controller associated with a version and gathers all routes
 * associated with this controller. For each route, the route handler is retrieved
 * and registered as a {@linkcode ControllerRoute}.
 *
 * If a route controller cannot be found, an error will be thrown.
 *
 * @param container The readonly {@linkcode Container} to fetch the route handlers from.
 * @param version The version to register the controller for.
 * @param controller The controller to register routes for
 * @returns All the registered controller routes.
 *
 * @example Usage
 * ```ts
 * import { ServerContext, Container, buildControllerRoutes } from "@eyrie/app";
 * import { assert } from "@std/assert";
 * import { MessageController } from "@examples/basic/basic_controller.ts"
 *
 * const ctx = new ServerContext("INFO");
 * const container = new Container
 * await container.build(ctx);
 * container.setupClass(MessageController);
 * const routes = buildControllerRoutes(container, "v1", MessageController);
 * assert(routes.length);
 * ```
 */
export function buildControllerRoutes(
  container: Readonly<Container>,
  version: string,
  controller: ClassType,
): ControllerRoute[] {
  const controllerRoutes: ControllerRoute[] = [];
  const controllerKey = getRegistrationKey(controller);
  const filteredRoutes = getRouteMetadataByController(controllerKey);
  for (const route of filteredRoutes) {
    const routeHandler = container.getClassMethod(
      route.controller,
      route.methodName as string,
    );
    const controller = getControllerMetadataByRoute(route);
    controllerRoutes.push({
      method: route.method,
      path: buildRoutePath(version, controller.path, route.path),
      handler: buildRouteHandler(route, routeHandler),
    });
  }
  return controllerRoutes;
}

/**
 * Built a route handler.
 *
 * If the request contains an input body, it attempts to get the
 * associated class. If none is found or registered, an error is thrown.
 *
 * The returned handler will do the following:
 *  - Deserialise the request body.
 *  - Run the method handler.
 *    - Any errors are caught and the error response is set accordingly.
 *  - Process the response.
 *
 * @param route The route metadata
 * @param methodHandler The method handler that will handle the request
 * @returns
 */
function buildRouteHandler(
  route: RouteMetadata,
  methodHandler: MethodHandler,
): RouteHandler {
  let bodyClass: ClassType | undefined = undefined;
  if (route.body) {
    const registeredClass = getClassRegistrationByKey(route.body);
    if (registeredClass.type !== ClassRegistrationType.InputType) {
      throw new RouterError(
        `Registered class for key ${
          String(route.body)
        } is not registered as an InputType`,
      );
    }
    bodyClass = registeredClass.target;
  }

  return async function runHandler(
    ctx: Context,
    params: Record<string, string | undefined>,
  ): Promise<Response> {
    let response: [object | BodyInit | null, ResponseInit | undefined];
    try {
      const body = await deserialiseRequestBody(bodyClass, ctx.request);
      const result = await methodHandler(ctx, params, body);
      response = [result, undefined];
    } catch (error) {
      response = buildErrorResponse(ctx, error);
    }
    return processResponse(ctx, ...response);
  };
}

/**
 * Deserialise the request body from input request.
 *
 * When there is an associated target prototype and body for
 * the request, the input is parsed into a JSON object and
 * assigned to the instantiated target.
 *
 * If there is no text or target to use, nothing is returned.
 * @param target
 * @param request
 * @returns
 */
async function deserialiseRequestBody(
  target: ClassType | undefined,
  request: Request,
): Promise<Record<string, unknown> | undefined> {
  if (!target) {
    return;
  }
  const body = await request.text();
  if (!body) {
    return;
  }
  const json = JSON.parse(body);
  return Object.assign(new target(), json);
}

/**
 * A route path for a URL. It always starts with: `/`
 */
export type RoutePath = `/${string}`;

/**
 * Build a route path from the defined paths.
 *
 * @param pathParts The input path parts
 * @returns The built route path
 */
function buildRoutePath(
  ...pathParts: string[]
): RoutePath {
  const pathname = join("/", ...pathParts).replaceAll("\\", "/").replace(
    /\/+$/,
    "",
  )
    .replace(
      /^\/+/,
      "/",
    );
  return pathname as RoutePath;
}

/**
 * The internal registered method handler that is run for a registered
 * route.
 *
 * The returned response is not yet serialised, it takes the
 */
type MethodHandler = (
  ctx: Context,
  params: Record<string, string | undefined>,
  body: Record<string, unknown> | undefined,
) => MaybePromise<Response | object | BodyInit | null>;

/**
 * The route handler that is run for the registered route.
 *
 * This includes serialisation of the response from the handler
 * into a valid {@linkcode Response}.
 */
export type RouteHandler = (
  ctx: Context,
  params: Record<string, string | undefined>,
) => MaybePromise<Response>;

// TODO(jonnydgreen): check if available in std
/**
 * The supported HTTP methods by the framework.
 */
export const enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

/**
 * A controller route returned by {@linkcode buildControllerRoutes}.
 */
export interface ControllerRoute {
  /**
   * The HTTP method of the controller route.
   */
  method: HttpMethod;
  /**
   * The route path of the controller route.
   */
  path: RoutePath;
  /**
   * The handler for the controller route.
   */
  handler: RouteHandler;
}

/**
 * Register a controller so its metadata can be used to build
 * the application router. This is predominantly for use by the
 * {@linkcode Controller} decorator.
 *
 * @param target The Controller to register
 * @param metadata The Controller metadata to register
 * @example Usage
 * ```ts no-assert
 * import { registerController, type InjectableRegistration, type Injectable } from "@eyrie/app";
 *
 * class MessageController implements Injectable {
 *  register(): InjectableRegistration {
 *    return { dependencies: [] };
 *  }
 * }
 *
 * registerController(MessageController, { path: '/messages' });
 * ```
 */
export function registerController(
  target: ClassType<Injectable>,
  metadata: ControllerMetadata,
): void {
  const key = registerClass({
    type: ClassRegistrationType.Injectable,
    target,
  });
  controllers.set(key, metadata);
}

/**
 * Register a router so its metadata can be used to build
 * the application router. This is predominantly for use by the
 * Http route decorators.
 *
 * @param key The unique route key to register
 * @param metadata The route metadata to register
 * @example Usage
 * ```ts no-assert
 * import { registerRoute, HttpMethod } from "@eyrie/app";
 *
 * const key = Symbol('route');
 * const controller = Symbol('controller');
 * const httpMethod = HttpMethod.GET;
 * const methodName = 'classMethodName';
 *
 * registerRoute(key, { path: '/messages', controller, method: httpMethod, methodName });
 * ```
 */
export function registerRoute(
  key: symbol,
  metadata: RouteMetadata,
): void {
  if (!routes.has(key)) {
    routes.set(key, metadata);
  }
}

function getRouteMetadataByController(
  controllerKey: symbol,
): RouteMetadata[] {
  return [...routes.values()].filter((route) =>
    route.controller === controllerKey
  );
}

function getControllerMetadataByRoute(
  route: RouteMetadata,
): ControllerMetadata {
  const controller = controllers.get(route.controller);
  if (!exists(controller)) {
    throw new RouterError(
      `Controller ${
        String(route.controller)
      } does not exist for route: ${route.method} ${route.path}`,
    );
  }
  return controller;
}

/**
 * A Router error that can be thrown when building application routes.
 *
 * @example Usage
 * ```ts
 * import { RouterError } from "@eyrie/app";
 * import { assert } from "@std/assert";
 *
 * const error = new RouterError()
 * assert(error instanceof Error);
 * assert(typeof error.message === "string");
 * ```
 */
export class RouterError extends Error {
  /**
   * The name of the error.
   * @example Usage
   * ```ts
   * import { RouterError } from "@eyrie/app";
   * import { assert, assertEquals } from "@std/assert";
   *
   * const error = new RouterError()
   * assertEquals(error.name, "RouterError");
   * ```
   */
  override readonly name = "RouterError";
}

export { type StatusCode } from "@std/http";

/**
 * An {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status|HTTP error}
 * that is thrown as part of the request lifecycle.
 *
 * @example Usage
 * ```ts
 * import { HttpError } from "@eyrie/app";
 * import { STATUS_CODE } from "@std/http";
 * import { assert, assertEquals } from "@std/assert";
 *
 * const error = new HttpError()
 * assert(error.name === "HttpError");
 * assertEquals(error.statusCode, STATUS_CODE.InternalServerError);
 * ```
 */
export class HttpError extends Error {
  /**
   * The name of the HTTP error.
   *
   * @example Usage
   * ```ts
   * import { HttpError } from "@eyrie/app";
   * import { STATUS_CODE } from "@std/http";
   * import { assert, assertEquals } from "@std/assert";
   *
   * const error = new HttpError()
   * assertEquals(error.name, "HttpError");
   * ```
   */
  override readonly name: string = "HttpError";
  /**
   * The HTTP status code of the HTTP error.
   *
   * @example Usage
   * ```ts
   * import { HttpError } from "@eyrie/app";
   * import { STATUS_CODE } from "@std/http";
   * import { assert, assertEquals } from "@std/assert";
   *
   * const error = new HttpError()
   * assertEquals(error.statusCode, STATUS_CODE.InternalServerError);
   * ```
   */
  readonly statusCode: StatusCode = STATUS_CODE.InternalServerError;
}

/**
 * An {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404|HTTP Not found}
 * error that is thrown when the server cannot find the requested resource.
 *
 * @example Usage
 * ```ts
 * import { NotFoundError } from "@eyrie/app";
 * import { STATUS_CODE } from "@std/http";
 * import { assert, assertEquals } from "@std/assert";
 *
 * const error = new NotFoundError()
 * assertEquals(error.name, "NotFoundError");
 * assertEquals(error.statusCode, STATUS_CODE.NotFound);
 * ```
 */
export class NotFoundError extends HttpError {
  /**
   * The name of the HTTP Not found error.
   *
   * @example Usage
   * ```ts
   * import { NotFoundError } from "@eyrie/app";
   * import { STATUS_CODE } from "@std/http";
   * import { assert, assertEquals } from "@std/assert";
   *
   * const error = new NotFoundError()
   * assertEquals(error.name, "NotFoundError");
   * ```
   */
  override readonly name = "NotFoundError";
  /**
   * The HTTP status code of the HTTP Not found error.
   *
   * @example Usage
   * ```ts
   * import { NotFoundError } from "@eyrie/app";
   * import { STATUS_CODE } from "@std/http";
   * import { assert, assertEquals } from "@std/assert";
   *
   * const error = new NotFoundError()
   * assertEquals(error.statusCode, STATUS_CODE.NotFound);
   * ```
   */
  override readonly statusCode: StatusCode = STATUS_CODE.NotFound;
}
