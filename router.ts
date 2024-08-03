// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assert, assertExists } from "@std/assert";
import { join } from "@std/path/join";
import { Container, getContainerClassMethod } from "./container.ts";
import type { Context } from "./context.ts";
import { controllers, RouteMetadata, routes } from "./decorators.ts";
import {
  ClassRegistrationType,
  getClassKey,
  getRegisteredClass,
} from "./registration.ts";
import { buildErrorResponse, processResponse } from "./response.ts";
import type { ClassType, MaybePromise } from "./utils.ts";

// TODO: doc-strings with full examples

export type Handler = (
  ctx: Context,
  params: Record<string, string | undefined>,
  body: Record<string, unknown> | undefined,
) => MaybePromise<Response | object | BodyInit | null>;

export function buildControllerRoutes(
  container: Container,
  version: string,
  controller: ClassType,
): ControllerRoute[] {
  const controllerRoutes: ControllerRoute[] = [];
  const controllerKey = getClassKey(controller);
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

function buildHandler(
  route: RouteMetadata,
  handler: Handler,
): ControllerRouteHandler {
  let bodyClass: ClassType | undefined = undefined;
  if (route.body) {
    const registeredClass = getRegisteredClass(route.body);
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

// TODO: check if available in std
export const enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export type ControllerRouteHandler = (
  ctx: Context,
  params: Record<string, string | undefined>,
) => MaybePromise<Response>;

export interface ControllerRoute {
  method: HttpMethod;
  path: `/${string}`;
  handler: ControllerRouteHandler;
}

export function buildRoutePath(
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
