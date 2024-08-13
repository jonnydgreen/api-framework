// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { ConsoleHandler, type LevelName, Logger } from "@std/log";

// TODO(jonnydgreen): define ourselves
export { type LevelName, Logger } from "@std/log";

/**
 * Create an logger for the defined log level.
 *
 * @param levelName The log level that the logger instance will run as.
 * @returns a Logger instance.
 *
 * @example Usage
 * ```ts
 * import { createLogger } from "@eyrie/app";
 * import { assert } from "@std/assert";
 *
 * const defaultLogger = createLogger();
 * assert(defaultLogger);
 *
 * const debugLogger = createLogger('DEBUG');
 * assert(debugLogger);
 * ```
 */
export function createLogger(levelName: LevelName = "INFO"): Logger {
  return new Logger("api-framework", levelName, {
    handlers: [new ConsoleHandler(levelName)],
  });
}
