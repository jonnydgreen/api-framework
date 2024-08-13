// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO(jonnydgreen): examples

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
 * Driver Not Implemented Error Options.
 */
export interface DriverNotImplementedErrorOptions {
  /**
   * The message of the Driver Not Implemented Error Options.
   */
  message: string;
}
