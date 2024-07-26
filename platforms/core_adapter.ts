// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: doc-strings with full examples

import { assert } from "@std/assert";
import { join } from "@std/path/join";
import type {
  ApplicationListenOptions,
  ApplicationVersionOptions,
} from "../application.ts";
import { type ControllerRoute, getControllerRoutes } from "../router.ts";
import type { Platform, Server } from "./platform.ts";
import { Context, ServerContext } from "../logger.ts";
import { handleResponse } from "../response.ts";

export class CorePlatformAdapter implements Platform {
  readonly #routes: Map<string, Map<string, ControllerRoute>>;
  readonly #ctx: ServerContext;

  constructor(ctx: Readonly<ServerContext>) {
    this.#routes = new Map();
    this.#ctx = ctx;
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
        this.#ctx.log.debug(`Registered route: ${route.method} ${routePath}`);
      }
    }
  }

  public listen(
    options: Required<ApplicationListenOptions>,
  ): Server {
    const onListen = this.#onListen.bind(this);
    const handler = this.#handler.bind(this);
    return Deno.serve({
      onListen,
      port: options?.port,
      hostname: options?.hostname,
    }, handler);
  }

  #handler(
    request: Request,
    _info: Deno.ServeHandlerInfo,
  ): Response | Promise<Response> {
    const ctx = new Context(this.#ctx, request);
    for (const [pathname, methods] of this.#routes) {
      console.log(request.url, pathname);
      const match = new URLPattern({ pathname }).exec(request.url);
      if (match) {
        const params = match.pathname.groups;
        const route = methods.get(request.method);
        if (route) {
          return handleResponse(ctx, route.handler(ctx, params));
        }
        return this.#notFoundResponse(ctx);
      }
    }
    return this.#notFoundResponse(ctx);
  }

  #notFoundResponse(ctx: Context): Promise<Response> {
    const { request } = ctx;
    const body = JSON.stringify({
      message: `Route ${request.method} ${request.url} not found`,
    });
    return handleResponse(ctx, body, { status: 404 });
  }

  #onListen({ hostname, port }: Deno.NetAddr): void {
    this.#ctx.log.info(
      `Listening on: http://${hostname ?? "localhost"}:${port}`,
    );
  }
}
