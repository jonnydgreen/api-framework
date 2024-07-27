// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertExists } from "@std/assert";
import { join } from "@std/path/join";
import { controllers, routes } from "./decorators.ts";
import type { Context } from "./logger.ts";
import { handleResponse } from "./response.ts";
import { getClassKey, getClassMethod, Kernel } from "./kernel.ts";
import type { ClassType, Fn } from "./utils.ts";

// TODO: doc-strings with full examples

export type Handler = (ctx: Context) => Promise<unknown>;

// TODO: move to server context
// function getRouteHandler(
//   kernel: Kernel,
//   controller: ControllerMetadata,
// ): Handler {
//   ctx;
// }

export function buildControllerRoutes(
  kernel: Kernel,
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
      kernel,
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
        // TODO: move the below line into handle response
        // TODO: consider having the response as the last thing
        const body = JSON.stringify(result);
        return handleResponse(ctx, body, { status: 200 });
      },
    });
  }
  return controllerRoutes;
}

export type HttpMethod = "GET";

export interface ControllerRoute {
  method: HttpMethod;
  path: `/${string}`;
  handler(
    ctx: Context,
    params: Record<string, string | undefined>,
  ): Response | Promise<Response>;
}

export interface ControllerRoute {
  method: HttpMethod;
  path: `/${string}`;
  handler(
    ctx: Context,
    params: Record<string, string | undefined>,
  ): Response | Promise<Response>;
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
