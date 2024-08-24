// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import {
  Application,
  type ApplicationServer,
  type ClassType,
} from "@eyrie/app";
import { teardownServer } from "./teardown_utils.ts";

export async function setupApplication(
  controllers: ClassType[],
): Promise<SetupApplicationResult> {
  const application = new Application({ logLevel: "CRITICAL" });

  application.registerVersion({
    version: "v1",
    controllers,
  });

  const server = await application.listen({ port: 0 });
  const origin = buildServerOrigin(server);
  return {
    application,
    server,
    origin,
    [Symbol.asyncDispose]: () => teardownServer(server),
  };
}

export function buildServerOrigin(server: ApplicationServer): URL {
  return new URL(`http://${server.addr.hostname}:${server.addr.port}`);
}

export function setupPermissions(
  options?: Deno.PermissionOptionsObject,
): Deno.PermissionOptionsObject {
  const baseNetPermissions = ["0.0.0.0", "localhost", "127.0.0.1"];
  const netPermissions = options?.net
    ? Array.isArray(options.net)
      ? [...options.net, ...baseNetPermissions]
      : options.net
    : baseNetPermissions;
  return {
    ...options,
    net: netPermissions,
  };
}

interface SetupApplicationResult {
  application: Application;
  server: ApplicationServer;
  origin: URL;
  [Symbol.asyncDispose]: () => Promise<void>;
}
