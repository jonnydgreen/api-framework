// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO(jonnydgreen): doc-strings with full examples

import type { ApplicationListenOptions } from "../application.ts";
import type { ControllerRoute } from "../router.ts";

export const enum DriverStrategy {
  Core = "Core",
}

export interface Server {
  finished: Promise<void>;
  shutdown(): Promise<void>;
  addr: Deno.NetAddr;
}

/**
 * The Driver Adaptor interface that all adaptors implement.
 */
export interface Driver {
  registerRoute(route: ControllerRoute): void;
  /**
   * Start listening for requests, processing registered routes for each request.
   * @param options - The required options to start listening for requests.
   */
  listen(options: Required<ApplicationListenOptions>): Server;
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
