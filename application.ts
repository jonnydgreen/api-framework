// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: doc-strings with full examples

import { CorePlatformAdapter } from "./platforms/core_adapter.ts";
import { OakPlatformAdapter } from "./platforms/oak_adapter.ts";
import { Platform, PlatformStrategy } from "./platforms/platform.ts";

/**
 * A class which starts the API applications and allows one to register
 * routes and capabilities to process inbound requests against.
 */
export class Application {
  readonly #platform: Platform;
  readonly #options: ApplicationOptions;

  constructor(options?: ApplicationOptions) {
    this.#options = options ?? {};

    // TODO: is it best practice to combine a strategy and adapter pattern in this way?
    const platform = options?.platform ?? PlatformStrategy.Core;
    switch (platform) {
      case PlatformStrategy.Oak: {
        this.#platform = new OakPlatformAdapter();
        break;
      }
      case PlatformStrategy.Core: {
        this.#platform = new CorePlatformAdapter();
        break;
      }
      default: {
        this.#platform = platform;
      }
    }
  }

  /**
   * Register a version of an API.
   * @param options - The required options to register an API version.
   */
  public registerVersion(options: ApplicationVersionOptions): void {
    this.#platform.registerVersion(options);
  }

  /**
   * Start listening for requests, processing registered routes for each request.
   * @param options - The required options to start listening for requests.
   */
  public async listen(options?: ApplicationListenOptions): Promise<void> {
    await this.#platform.listen({
      ...options,
      port: options?.port ?? 8080,
      hostname: options?.hostname ?? "0.0.0.0",
    });
  }
}

/**
 * The Application Options
 */
export interface ApplicationOptions {
  platform?: PlatformStrategy | Platform;
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
   * __Note about `0.0.0.0`__ While listening `0.0.0.0` works on all platforms,
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
  controllers: unknown[];
}
