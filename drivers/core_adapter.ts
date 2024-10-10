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

/**
 * The core driver adapter contains all the default logic from processing
 * incoming requests. It is the default for the {@linkcode Application}.
 *
 * @example Default usage within the {@linkcode Application}.
 * ```ts
 * import { Application } from "@eyrie/app";
 * import { assert } from "@std/assert";
 * import { MessageController } from "@examples/basic/basic_controller.ts"
 *
 * const app = new Application();
 *
 * app.registerVersion({
 *   version: "v1",
 *   controllers: [MessageController],
 * });
 *
 * const server = await app.listen();
 * assert(server);
 * await server.shutdown();
 * ```
 */
export class CoreDriverAdapter implements Driver {
  readonly #routes: Map<string, Map<string, ControllerRoute>>;
  readonly #ctx: ServerContext;

  /**
   * The core driver adapter contains all the default logic from processing
   * incoming requests.
   *
   * @param ctx The server context.
   */
  constructor(ctx: Readonly<ServerContext>) {
    this.#routes = new Map();
    this.#ctx = ctx;
  }

  /**
   * Register a controller route.
   * @param route The controller route input.
   *
   * @example Default usage within the {@linkcode Application}.
   * ```ts
   * import { Application } from "@eyrie/app";
   * import { assert } from "@std/assert";
   * import { MessageController } from "@examples/basic/basic_controller.ts"
   *
   * const app = new Application();
   *
   * app.registerVersion({
   *   version: "v1",
   *   controllers: [MessageController],
   * });
   *
   * const server = await app.listen();
   * assert(server);
   * await server.shutdown();
   * ```
   */
  registerRoute(route: ControllerRoute): void {
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

  /**
   * Start listening for requests, processing registered routes for each request.
   * @param options - The required options to start listening for requests.
   * @returns The application server that is listening on the defined port.
   *
   * @example Default usage within the {@linkcode Application}.
   * ```ts
   * import { Application } from "@eyrie/app";
   * import { assert } from "@std/assert";
   * import { MessageController } from "@examples/basic/basic_controller.ts"
   *
   * const app = new Application();
   *
   * app.registerVersion({
   *   version: "v1",
   *   controllers: [MessageController],
   * });
   *
   * const server = await app.listen();
   * assert(server);
   * await server.shutdown();
   * ```
   */
  listen(
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
