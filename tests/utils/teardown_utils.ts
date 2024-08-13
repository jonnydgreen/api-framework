// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import type { ApplicationServer } from "../../application.ts";

export function teardownServer(server: ApplicationServer): Promise<void> {
  server.shutdown();
  return server.finished;
}
