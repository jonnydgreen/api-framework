// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { CoreDriverAdapter } from "./drivers/core_adapter.ts";
import { type Driver, DriverStrategy } from "./drivers/driver.ts";
import { ServerContext } from "./context.ts";
import { Container } from "./container.ts";
import { buildControllerRoutes } from "./router.ts";
import { assertNever, type ClassType } from "./utils.ts";
import type { LevelName } from "./logger.ts";

/**
 * A class which starts the API applications and allows one to register
 * routes and capabilities to process inbound requests against.
 *
 * @example Usage
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
export class Application {
  /**
   * The options of the {@linkcode Application}
   * @example Usage
   * ```ts
   * import { Application, DriverStrategy } from "@eyrie/app";
   * import { assertEquals } from "@std/assert";
   *
   * const app = new Application();
   * assertEquals(app.options.logLevel, "INFO")
   * assertEquals(app.options.driver, DriverStrategy.Core)
   * ```
   */
  readonly options: Readonly<ApplicationOptions>;
  /**
   * The server context of the {@linkcode Application}
   * @example Usage
   * ```ts no-assert
   * import { Application } from "@eyrie/app";
   *
   * const app = new Application();
   * app.ctx.log.info("Hello")
   * ```
   */
  readonly ctx: Readonly<ServerContext>;

  /**
   * The {@linkcode Container} of all injectables that can be used in the DI framework.
   * @example Usage
   * ```ts no-assert
   * import { Application } from "@eyrie/app";
   *
   * const app = new Application();
   * await app.container.build(app.ctx)
   * ```
   */
  readonly container: Readonly<Container>;

  readonly #driver: Readonly<Driver>;
  readonly #versions = new Map<string, ApplicationVersionOptions>();

  /**
   * A class which starts the API applications and allows one to register
   * routes and capabilities to process inbound requests against.
   *
   * @param options The options used to start the {@linkcode Application}.
   */
  constructor(options?: ApplicationOptions) {
    // Driver
    const defaultDriver = DriverStrategy.Core;
    const driver = options?.driver ?? defaultDriver;

    // Log level
    const defaultLogLevel: LevelName = "INFO";
    const logLevel: LevelName = options?.logLevel ?? defaultLogLevel;

    // Setup
    const defaultOptions: Required<ApplicationOptions> = {
      driver: defaultDriver,
      logLevel: defaultLogLevel,
    };
    this.options = { ...defaultOptions, ...options };
    this.ctx = new ServerContext(logLevel);
    this.container = new Container();
    this.#driver = this.#setupDriver(driver);
  }

  /**
   * Register a version of an API.
   * @param options - The required options to register an API version.
   * @example Usage
   * ```ts no-assert
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
   * ```
   */
  registerVersion(options: ApplicationVersionOptions): void {
    this.#versions.set(options.version, options);
  }

  /**
   * Start listening for requests, processing registered routes for each request.
   * @param options - The required options to start listening for requests.
   * @returns The {@linkcode ApplicationServer} that is being listened on.
   * @example Usage
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
  async listen(
    options?: ApplicationListenOptions,
  ): Promise<ApplicationServer> {
    // Build container to ensure all decorators have been called
    // Once built, register all the routes for each version
    await this.container.build(this.ctx);
    for (const [version, { controllers }] of this.#versions) {
      for (const controller of controllers) {
        this.container.setupClass(controller);
        const controllerRoutes = buildControllerRoutes(
          this.container,
          version,
          controller,
        );
        for (const route of controllerRoutes) {
          this.#driver.registerRoute(route);
          this.ctx.log.debug(
            `Registered route: ${route.method} ${route.path}`,
          );
        }
      }
    }
    return this.#driver.listen({
      ...options,
      port: options?.port ?? 8080,
      hostname: options?.hostname ?? "0.0.0.0",
    });
  }

  #setupDriver(driver: Driver | DriverStrategy): Driver {
    if (typeof driver === "object") {
      return driver;
    }
    switch (driver) {
      case DriverStrategy.Core: {
        return new CoreDriverAdapter(this.ctx);
      }
      default: {
        assertNever(
          driver,
          new ApplicationError(`Unsupported driver: ${driver}`),
        );
      }
    }
  }
}

/**
 * The Application Options for {@linkcode Application}
 */
export interface ApplicationOptions {
  /**
   * The driver used by the {@linkcode Application} to handle HTTP traffic.
   * @default DriverStrategy.Core
   */
  driver?: DriverStrategy | Driver;
  /**
   * The log level used by the {@linkcode Logger} within the {@linkcode Application}.
   */
  logLevel?: LevelName;
}

/**
 * The server returned by {@linkcode Application.listen}.
 */
export interface ApplicationServer {
  /**
   * A promise that resolves once server finishes.
   */
  finished: Promise<void>;

  /**
   * Gracefully close the server. No more new connections will be accepted,
   * while pending requests will be allowed to finish.
   */
  shutdown(): Promise<void>;

  /**
   * The local address this server is listening on.
   */
  addr: Deno.NetAddr;
}

/**
 * The Application Listen Options for {@linkcode Application.listen}
 */
export interface ApplicationListenOptions {
  /**
   * The port to listen on.
   *
   * When the port is set to `0`, the operating system will select the port.
   *
   * @default {8080} */
  port?: number;

  /**
   * A literal IP address or host name that can be resolved to an IP address.
   *
   * __Note about `0.0.0.0`__ While listening `0.0.0.0` works on all drivers,
   * the browsers on Windows don't work with the address `0.0.0.0`.
   * As a result, a message of `server running on localhost:8080` instead of
   * `server running on 0.0.0.0:8080` is shown to support Windows.
   *
   * @default {"0.0.0.0"} */
  hostname?: string;
}

/**
 * The Application route version. The following version conventions are supported:
 *  - `^v[0-9]+$`
 *  - `^v[0-9]beta[0-9]+$`
 *  - `^v[0-9]alpha[0-9]+$`
 */
export type ApplicationVersion = `v${number}${
  | ""
  | `beta${number}`
  | `alpha${number}`}`;

/**
 * The application version options when registering a version using {@linkcode Application.registerVersion}
 */
export interface ApplicationVersionOptions {
  /**
   * The application version to register. Must be unique to the application.
   */
  version: ApplicationVersion;
  /**
   * The controllers to register for the application version. Each controller
   * route path will be prefixed with the application version. For example, if
   * a controller route of `/properties` is registered, then the application route
   * will be `/v1/properties` when the version is `v1`.
   */
  controllers: ClassType[];
}

/**
 * An application error that can be thrown when something goes wrong within the application lifecycle.
 *
 * @example Usage
 * ```ts
 * import { ApplicationError } from "@eyrie/app";
 * import { assert } from "@std/assert";
 *
 * const error = new ApplicationError()
 * assert(error instanceof Error);
 * assert(typeof error.message === "string");
 * ```
 */
export class ApplicationError extends Error {
  /**
   * The name of the error.
   * @example Usage
   * ```ts
   * import { ApplicationError } from "@eyrie/app";
   * import { assert } from "@std/assert";
   *
   * const error = new ApplicationError()
   * assert(error.name === "ApplicationError");
   * ```
   */
  override readonly name = "ApplicationError";
}
