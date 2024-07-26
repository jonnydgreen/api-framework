// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: doc-strings with full examples

import type {
  ApplicationListenOptions,
  ApplicationVersionOptions,
} from "../application.ts";

// TODO: docs
export const enum PlatformStrategy {
  Core = "Core",
}

// TODO: doc string
export interface Server {
  finished: Promise<void>;
  shutdown(): Promise<void>;
  addr: Deno.NetAddr;
}

/**
 * The Platform Adaptor interface that all adaptors implement.
 *
 * When an option is not supported, a `PlatformNotImplementedError`
 * will be thrown.
 */
export interface Platform {
  /**
   * Register a version of an API.
   * @param options - The required options to register an API version.
   */
  registerVersion(options: Required<ApplicationVersionOptions>): void;
  /**
   * Start listening for requests, processing registered routes for each request.
   * @param options - The required options to start listening for requests.
   */
  listen(options: Required<ApplicationListenOptions>): Server;
}

/**
 * Platform Not Implemented Error.
 *
 * This should be used in any platform adaptor implementation when
 * an option is not supported and is used by a user.
 */
export class PlatformNotImplementedError extends Error {
  override readonly name = "PlatformNotImplementedError";
  constructor(options: PlatformNotImplementedErrorOptions) {
    super(options.message);
  }
}

/**
 * Platform Not Implemented Error Options.
 */
export interface PlatformNotImplementedErrorOptions {
  /**
   * The message of the Platform Not Implemented Error Options.
   */
  message: string;
}
