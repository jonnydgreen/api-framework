// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: doc-strings with full examples

// TODO: define ourselves
import type { LevelName, Logger } from "@std/log";
import { CoreDriverAdapter } from "./drivers/core_adapter.ts";
import { type Driver, DriverStrategy, type Server } from "./drivers/driver.ts";
import { ServerContext } from "./context.ts";
import { buildContainer, registerContainerClassMethods } from "./container.ts";
import { buildControllerRoutes } from "./router.ts";
import { assertNever, ClassType } from "./utils.ts";

/**
 * A class which starts the API applications and allows one to register
 * routes and capabilities to process inbound requests against.
 */
export class Application {
  readonly options: Readonly<ApplicationOptions>;
  readonly #driver: Readonly<Driver>;
  readonly #versions = new Map<string, ApplicationVersionOptions>();

  public readonly ctx: Readonly<ServerContext>;

  public readonly log: Readonly<Logger>;

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
    this.log = this.ctx.log;
    this.#driver = this.#setupDriver(driver);
  }

  /**
   * Register a version of an API.
   * @param options - The required options to register an API version.
   */
  public registerVersion(options: ApplicationVersionOptions): void {
    this.#versions.set(options.version, options);
  }

  /**
   * Start listening for requests, processing registered routes for each request.
   * @param options - The required options to start listening for requests.
   */
  public async listen(options?: ApplicationListenOptions): Promise<Server> {
    // Build container to ensure all decorators have been called
    // Once built, register all the routes for each version
    const container = await buildContainer(this.ctx);
    for (const [version, { controllers }] of this.#versions) {
      for (const controller of controllers) {
        registerContainerClassMethods(container, controller);
        const controllerRoutes = buildControllerRoutes(
          container,
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
        assertNever(driver, `Unsupported driver: ${driver}`);
      }
    }
  }
}

/**
 * The Application Options
 */
export interface ApplicationOptions {
  driver?: DriverStrategy | Driver;
  logLevel?: LevelName;
}

/**
 * The Application Listen Options.
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
 * The application version options when registering a version.
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
