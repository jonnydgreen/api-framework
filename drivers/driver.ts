// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import type {
  ApplicationListenOptions,
  ApplicationServer,
} from "../application.ts";
import type { ControllerRoute } from "../router.ts";

/**
 * The driver strategy.
 */
export const enum DriverStrategy {
  /**
   * The core driver strategy.
   */
  Core = "Core",
}

/**
 * The Driver Adaptor interface that all adaptors implement.
 */
export interface Driver {
  /**
   * Register a controller route.
   * @param route The controller route input.
   */
  registerRoute(route: ControllerRoute): void;

  /**
   * Start listening for requests, processing registered routes for each request.
   * @param options - The required options to start listening for requests.
   */
  listen(options: Required<ApplicationListenOptions>): ApplicationServer;
}

/**
 * A driver error that can be thrown when the driver fails in processing requests.
 * @example Usage
 * ```ts
 * import { DriverError } from "@eyrie/app";
 * import { assert } from "@std/assert";
 *
 * const error = new DriverError()
 * assert(error instanceof Error);
 * assert(typeof error.message === "string");
 * ```
 */
export class DriverError extends Error {
  /**
   * The name of the error.
   * @example Usage
   * ```ts
   * import { DriverError } from "@eyrie/app";
   * import { assert } from "@std/assert";
   *
   * const error = new DriverError()
   * assert(error.name === "DriverError");
   * ```
   */
  override readonly name = "DriverError";
}
