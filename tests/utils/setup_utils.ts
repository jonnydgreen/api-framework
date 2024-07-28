// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import { Application } from "../../application.ts";
import type { Server } from "../../drivers/driver.ts";
import type { ClassType } from "../../utils.ts";

export async function setupApplication(controllers: ClassType[]): Promise<[
  application: Application,
  server: Server,
  origin: URL,
]> {
  const app = new Application({ logLevel: "CRITICAL" });

  app.registerVersion({
    version: "v1",
    controllers,
  });

  const server = await app.listen({ port: 0 });
  const origin = buildServerOrigin(server);
  return [app, server, origin];
}

export function buildServerOrigin(server: Server): URL {
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
