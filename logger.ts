// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { ConsoleHandler, LevelName, Logger } from "@std/log";

// TODO: doc string

export function createLogger(levelName: LevelName = "DEBUG"): Logger {
  return new Logger("api-framework", levelName, {
    handlers: [new ConsoleHandler(levelName)],
  });
}

export class ServerContext {
  public readonly log: Readonly<Logger>;

  constructor(levelName: LevelName = "DEBUG") {
    this.log = createLogger(levelName);
  }
}

// TODO: move
export class Context {
  public readonly log: Readonly<Logger>;
  public readonly request: Readonly<Request>;

  constructor(ctx: ServerContext, request: Request) {
    // TODO: create child logger with correlation ID
    this.log = ctx.log;
    this.request = request;
  }
}
