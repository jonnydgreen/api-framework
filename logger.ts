import { ConsoleHandler, LevelName, Logger } from "@std/log";

// TODO: doc string

export function createLogger(levelName: LevelName = "DEBUG"): Logger {
  return new Logger("api-framework", levelName, {
    handlers: [new ConsoleHandler(levelName)],
  });
}

// TODO: move
export class ServerContext {
  public readonly log: Readonly<Logger>;

  constructor(levelName: LevelName = "DEBUG") {
    this.log = createLogger(levelName);
  }
}
