// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import type {
  ApplicationListenOptions,
  ApplicationServer,
} from "../application.ts";
import { Context, type ServerContext } from "../context.ts";
import { buildErrorResponse, processResponse } from "../response.ts";
import { type ControllerRoute, NotFoundError } from "../router.ts";
import type { MaybePromise } from "../utils.ts";
import { type Driver, DriverError } from "./driver.ts";

export class CoreDriverAdapter implements Driver {
  readonly #routes: Map<string, Map<string, ControllerRoute>>;
  readonly #ctx: ServerContext;

  constructor(ctx: Readonly<ServerContext>) {
    this.#routes = new Map();
    this.#ctx = ctx;
  }

  public registerRoute(route: ControllerRoute): void {
    const methods = this.#routes.get(route.path);
    if (methods) {
      const routeDetails = methods.get(route.method);
      if (routeDetails) {
        throw new DriverError(
          `Route ${route.method} ${route.path} already registered`,
        );
      }
      methods.set(route.method, route);
    } else {
      const routeDetails = new Map<string, ControllerRoute>();
      routeDetails.set(route.method, route);
      this.#routes.set(route.path, routeDetails);
    }
  }

  public listen(
    options: Required<ApplicationListenOptions>,
  ): ApplicationServer {
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
  ): MaybePromise<Response> {
    const ctx = new Context(this.#ctx, request);
    for (const [pathname, methods] of this.#routes) {
      const match = new URLPattern({ pathname }).exec(request.url);
      if (match) {
        const params = match.pathname.groups;
        const route = methods.get(request.method);
        if (route) {
          return route.handler(ctx, params);
        }
        return this.#notFoundResponse(ctx);
      }
    }
    return this.#notFoundResponse(ctx);
  }

  #notFoundResponse(ctx: Context): Promise<Response> {
    const { request } = ctx;
    const requestPath = new URL(request.url).pathname;
    const [body, responseInit] = buildErrorResponse(
      ctx,
      new NotFoundError(`Route ${request.method} ${requestPath} not found`),
    );
    return processResponse(ctx, body, responseInit);
  }

  #onListen({ hostname, port }: Deno.NetAddr): void {
    this.#ctx.log.info(
      `Listening on: http://${hostname}:${port}`,
    );
  }
}
