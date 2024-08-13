// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assert } from "@std/assert";
import { join } from "@std/path/join";
import { type Container, getContainerClassMethod } from "./container.ts";
import type { Context } from "./context.ts";
import {
  getControllerMetadataByRoute,
  getRouteMetadataByController,
  type RouteMetadata,
} from "./decorators.ts";
import {
  ClassRegistrationType,
  getClassRegistrationByKey,
  getRegistrationKey,
} from "./registration.ts";
import { buildErrorResponse, processResponse } from "./response.ts";
import type { ClassType, MaybePromise } from "./utils.ts";

// TODO(jonnydgreen): examples

/**
 * Build the controller routes for a specified version.
 *
 * This fetches the controller associated with a version and gathers all routes
 * associated with this controller. For each route, the route handler is retrieved
 * and registered as a {@linkcode ControllerRoute}.
 *
 * If a route controller cannot be found, an error will be thrown.
 *
 * @param container The container to fetch the route handlers from.
 * @param version The version to register the controller for.
 * @param controller The controller to register routes for
 * @returns All the registered controller routes.
 */
export function buildControllerRoutes(
  container: Container,
  version: string,
  controller: ClassType,
): ControllerRoute[] {
  const controllerRoutes: ControllerRoute[] = [];
  const controllerKey = getRegistrationKey(controller);
  const filteredRoutes = getRouteMetadataByController(controllerKey);
  for (const route of filteredRoutes) {
    const routeHandler = getContainerClassMethod(
      container,
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
    assert(
      registeredClass.type === ClassRegistrationType.InputType,
      `Registered class for key ${
        String(route.body)
      } is not registered as an InputType`,
    );
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
