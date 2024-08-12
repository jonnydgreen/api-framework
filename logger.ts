// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { ConsoleHandler, type LevelName, Logger } from "@std/log";

// TODO(jonnydgreen): example

// TODO(jonnydgreen): define ourselves
export { type LevelName, Logger } from "@std/log";

/**
 * Create an logger for the defined log level.
 *
 * @param levelName The log level that the logger instance will run as.
 * @returns a Logger instance.
 */
export function createLogger(levelName: LevelName = "DEBUG"): Logger {
  return new Logger("api-framework", levelName, {
    handlers: [new ConsoleHandler(levelName)],
  });
}
