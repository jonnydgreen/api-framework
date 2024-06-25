// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: doc-strings with full examples

import { assert } from "@std/assert";
import { join } from "@std/path/posix/join";
import type {
  ApplicationListenOptions,
  ApplicationVersionOptions,
} from "../application.ts";
import {
  Context,
  type ControllerRoute,
  getControllerRoutes,
} from "../router.ts";
import type { Platform } from "./platform.ts";

export class CorePlatformAdapter implements Platform {
  #routes: Map<string, Map<string, ControllerRoute>>;

  constructor() {
    this.#routes = new Map();
  }

  public registerVersion(options: Required<ApplicationVersionOptions>): void {
    const prefix = `/${options.version}`;
    for (const controller of options.controllers) {
      const routes = getControllerRoutes(controller);
      for (const route of routes) {
        const routePath = join(prefix, route.path);
        const methods = this.#routes.get(routePath);
        if (methods) {
          const routeDetails = methods.get(route.method);
          assert(
            !routeDetails,
            `Route ${route.method} ${routePath} already registered`,
          );
          methods.set(route.method, route);
        } else {
          const routeDetails = new Map<string, ControllerRoute>();
          routeDetails.set(route.method, route);
          this.#routes.set(routePath, routeDetails);
        }
      }
    }
  }

  public async listen(
    options: Required<ApplicationListenOptions>,
  ): Promise<void> {
    const onListen = this.#onListen.bind(this);
    const handler = this.#handler.bind(this);
    const server = Deno.serve({
      onListen,
      port: options?.port,
      hostname: options?.hostname,
    }, handler);

    await server.finished;
  }

  #handler(
    request: Request,
    _info: Deno.ServeHandlerInfo,
  ): Response | Promise<Response> {
    for (const [pathname, methods] of this.#routes) {
      const match = new URLPattern({ pathname }).exec(request.url);
      if (match) {
        const params = match.pathname.groups;
        const route = methods.get(request.method);
        if (route) {
          const ctx: Context = { request };
          return route.handler(ctx, params);
        }
        return this.#notFoundResponse(request);
      }
    }
    return this.#notFoundResponse(request);
  }

  #notFoundResponse(request: Request): Response {
    const body = JSON.stringify({
      message: `Route ${request.method} ${request.url} not found`,
    });
    return new Response(body, { status: 404 });
  }

  #onListen({ hostname, port }: Deno.NetAddr): void {
    console.log(
      `Listening on: http://${hostname ?? "localhost"}:${port}`,
    );
  }
}
