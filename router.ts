// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertExists } from "@std/assert";
import { join } from "@std/path/join";
import { controllers, routes } from "./decorators.ts";
import type { Context } from "./context.ts";
import { processResponse } from "./response.ts";
import { Container, getClassKey, getClassMethod } from "./container.ts";
import type { ClassType, Fn, MaybePromise } from "./utils.ts";

// TODO: doc-strings with full examples

export type Handler = (
  ctx: Context,
  params: Record<string, string | undefined>,
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
    const routeHandler: Fn = getClassMethod(
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
      // TODO: maybe do this elsewhere and leave the handler largely as is
      // TODO: don't always make a promise
      // TODO: need serialisation flows here
      async handler(ctx): Promise<Response> {
        const result = await routeHandler(ctx);
        // TODO: move the below line into handle response so we can serialise based on content-type
        // TODO: consider having the response as the last thing
        const body = JSON.stringify(result);
        return processResponse(ctx, body, { status: 200 });
      },
    });
  }
  return controllerRoutes;
}

// TODO: check if available in std
export const enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export interface ControllerRoute {
  method: HttpMethod;
  path: `/${string}`;
  handler: Handler;
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
