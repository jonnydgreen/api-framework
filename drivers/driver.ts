// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: doc-strings with full examples

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
 *
 * When an option is not supported, a `DriverNotImplementedError`
 * will be thrown.
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
 * Driver Not Implemented Error.
 *
 * This should be used in any driver adaptor implementation when
 * an option is not supported and is used by a user.
 */
export class DriverNotImplementedError extends Error {
  override readonly name = "DriverNotImplementedError";
  constructor(options: DriverNotImplementedErrorOptions) {
    super(options.message);
  }
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
