// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import type { LevelName, Logger } from "@std/log";
import { createLogger } from "./logger.ts";

/**
 * The server context. This is created for the {@linkcode Application} instance
 * and contains crucial application-specific information and functionality
 * to be used throughout the lifetime of the {@linkcode Application}.
 */
export class ServerContext {
  /**
   * A logger instance scoped to the {@linkcode Application}
   */
  public readonly log: Readonly<Logger>;

  /**
   * The server context. This is created for the {@linkcode Application} instance
   * and contains crucial application-specific information and functionality
   * to be used throughout the lifetime of the {@linkcode Application}.
   */
  constructor(levelName: LevelName) {
    this.log = createLogger(levelName);
  }
}

/**
 * The request context. This is created for every incoming {@linkcode Request}
 * and contains crucial request-specific information and functionality
 * to be used by the handler of the request.
 */
export class Context {
  /**
   * A logger instance scoped to the {@linkcode Request}.
   */
  public readonly log: Readonly<Logger>;

  /**
   * The incoming request instance.
   */
  public readonly request: Readonly<Request>;

  /**
   * The request context. This is created for every incoming {@linkcode Request}
   * and contains crucial request-specific information and functionality
   * to be used by the handler of the request.
   */
  constructor(
    ctx: ServerContext,
    request: Request,
  ) {
    // TODO(jonnydgreen): create child logger with correlation ID
    this.log = ctx.log;
    this.request = request;
  }
}
