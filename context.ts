// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { type LevelName, Logger } from "@std/log";
import { createLogger } from "./logger.ts";

// TODO: doc string

export class ServerContext {
  public readonly log: Readonly<Logger>;

  constructor(levelName: LevelName = "DEBUG") {
    this.log = createLogger(levelName);
  }
}

export class Context {
  public readonly log: Readonly<Logger>;
  public readonly request: Readonly<Request>;

  constructor(ctx: ServerContext, request: Request) {
    // TODO: create child logger with correlation ID
    this.log = ctx.log;
    this.request = request;
  }
}
