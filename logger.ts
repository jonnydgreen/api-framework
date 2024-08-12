// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { ConsoleHandler, type LevelName, Logger } from "@std/log";

// TODO: doc string

export function createLogger(levelName: LevelName = "DEBUG"): Logger {
  return new Logger("api-framework", levelName, {
    handlers: [new ConsoleHandler(levelName)],
  });
}
