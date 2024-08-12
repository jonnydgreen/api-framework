// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assert, assertExists } from "@std/assert";
import { join } from "@std/path/join";
import { type Container, getContainerClassMethod } from "./container.ts";
import type { Context } from "./context.ts";
import { controllers, type RouteMetadata, routes } from "./decorators.ts";
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
  const filteredRoutes = [...routes.values()].filter((route) =>
    route.controller === controllerKey
  );
  for (const route of filteredRoutes) {
    const routeHandler = getContainerClassMethod(
      container,
      route.controller,
      route.propertyName as string,
    );
    const controller = controllers.get(route.controller);
    assertExists(
      controller,
      `Controller ${
        String(route.controller)
      } does not exist for route: ${route.method}`,
    );
    controllerRoutes.push({
      method: route.method,
      path: buildRoutePath(version, controller.path, route.path),
      handler: buildHandler(route, routeHandler),
    });
  }
  return controllerRoutes;
}

// TODO: doc string
function buildHandler(
  route: RouteMetadata,
  handler: MethodHandler,
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
      const result = await handler(ctx, params, body);
      response = [result, undefined];
    } catch (error) {
      response = buildErrorResponse(ctx, error);
    }
    return processResponse(ctx, ...response);
  };
}

// TODO: doc string
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

// TODO: doc string
function buildRoutePath(
  ...paths: string[]
): `/${string}` {
  const pathname = join("/", ...paths).replaceAll("\\", "/").replace(
    /\/+$/,
    "",
  )
    .replace(
      /^\/+/,
      "/",
    );
  return pathname as `/${string}`;
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
   * The HTTP path of the controller route.
   */
  path: `/${string}`;
  /**
   * The handler for the controller route.
   */
  handler: RouteHandler;
}
