// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { OakPlatformAdapter } from "./platforms/oak_adapter.ts";
import { Platform } from "./platforms/platform.ts";

export class Application {
  #platform: Platform;

  constructor() {
    // TODO: make this configurable
    this.#platform = new OakPlatformAdapter();
  }

  public registerVersion(options: ApplicationVersionOptions): void {
    this.#platform.registerVersion(options);
  }

  public async listen(options?: ApplicationListenOptions): Promise<void> {
    await this.#platform.listen({
      ...options,
      port: options?.port ?? 8080,
      hostname: options?.hostname ?? "0.0.0.0",
    });
  }
}

/**
 * The Application Listen Options.
 */
export interface ApplicationListenOptions {
  /**
   * The port to listen on.
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

// TODO: docs
export type ApplicationVersion = `v${number}${
  | `alpha${number}`
  | `beta${number}`
  | ""}`;

// TODO: docs
export interface ApplicationVersionOptions {
  version: ApplicationVersion;
  controllers: unknown[];
}
