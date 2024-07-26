// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import type { Server } from "../../platforms/platform.ts";

export function teardownServer(server: Server): Promise<void> {
  server.shutdown();
  return server.finished;
}
