// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import { Application } from "../../application.ts";
import { Controller, Get } from "../../decorators.ts";
import type { Server } from "../../platforms/platform.ts";

export function setupApplication(): [
  application: Application,
  server: Server,
  origin: URL,
] {
  @Controller("/messages")
  class MessageController {
    @Get({ path: "/" })
    public getMessages() {
      return [
        {
          id: "1",
          content: "Hello",
        },
        {
          id: "2",
          content: "Hiya",
        },
      ];
    }
  }

  const app = new Application({ logLevel: "DEBUG" });
  new MessageController();

  app.registerVersion({
    version: "v1",
    controllers: [MessageController],
  });

  const server = app.listen({ port: 0 });
  const origin = new URL(`http://${server.addr.hostname}:${server.addr.port}`);
  return [app, server, origin];
}

export function setupPermissions(
  options?: Deno.PermissionOptionsObject,
): Deno.PermissionOptionsObject {
  const baseNetPermissions = ["0.0.0.0", "localhost"];
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
