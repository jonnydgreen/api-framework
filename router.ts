// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertExists } from "@std/assert";
import { join } from "@std/path/join";
import { controllers, routes } from "./decorators.ts";
import { handleResponse } from "./response.ts";
import type { Context } from "./logger.ts";

// TODO: doc-strings with full examples

export function getControllerRoutes(_controller: unknown): ControllerRoute[] {
  const controllerRoutes: ControllerRoute[] = [];
  routes.forEach((route) => {
    const controller = controllers.get(route.controller);
    assertExists(
      controller,
      `Controller ${
        String(route.controller)
      } does not exist for route: ${route.method}`,
    );
    controllerRoutes.push({
      method: route.method,
      path: join(controller.path, route.path).replace(/\/+$/, "").replace(
        /^\/+/,
        "/",
      ) as `/${string}`,
      // TODO: maybe do this elsewhere and leave the handler largely as is
      // TODO: don't always make a promise
      // TODO: need serialisation flows here
      async handler(ctx): Promise<Response> {
        const result = await route.handler();
        // TODO: move the below line into handle response
        // TODO: consider having the response as the last thing
        const body = JSON.stringify(result);
        return handleResponse(ctx, body, { status: 200 });
      },
    });
  });
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
