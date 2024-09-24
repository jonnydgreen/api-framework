// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import type { ApplicationServer } from "@eyrie/app";

export async function teardownServer(
  server: ApplicationServer,
): Promise<void> {
  server.shutdown();
  await server.finished;
}
