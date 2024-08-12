// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import {
  assertEquals,
  assertInstanceOf,
  AssertionError,
  assertRejects,
  assertStrictEquals,
  assertThrows,
} from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { Application } from "../application.ts";
import type { Injectable, InjectableRegistration } from "../registration.ts";
import { ServerContext } from "../context.ts";
import { Controller, Get } from "../decorators.ts";
import { HttpMethod } from "../router.ts";
import { buildServerOrigin, setupPermissions } from "./utils/setup_utils.ts";
import { teardownServer } from "./utils/teardown_utils.ts";
import { DriverStrategy, type Server } from "../drivers/driver.ts";
import { CoreDriverAdapter } from "../drivers/core_adapter.ts";
import { Logger } from "../logger.ts";

Deno.test({
  name: "Application() supports default settings",
  permissions: setupPermissions(),
  fn() {
    // Arrange
    const app = new Application();

    // Assert
    assertEquals(app.options, {
      driver: DriverStrategy.Core,
      logLevel: "INFO",
    });
    assertInstanceOf(app.ctx, ServerContext);
    assertInstanceOf(app.log, Logger);
    assertStrictEquals(app.log.levelName, "INFO");
  },
});

Deno.test({
  name: "Application() supports a custom driver",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const ctx = new ServerContext("CRITICAL");
    const customDriver = new CoreDriverAdapter(ctx);
    const app = new Application({ driver: customDriver });
    app.registerVersion({
      version: "v1",
      controllers: [MessageController],
    });
    const server = await app.listen({ port: 0 });
    const origin = buildServerOrigin(server);
    const url = new URL("/v1/messages", origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.GET });

    // Assert
    assertEquals(app.options, { driver: customDriver, logLevel: "INFO" });
    assertStrictEquals(response.status, STATUS_CODE.OK);
    assertStrictEquals(response.statusText, STATUS_TEXT[STATUS_CODE.OK]);
    assertEquals(await response.json(), [
      {
        id: "1",
        content: "Hello",
      },
      {
        id: "2",
        content: "Hiya",
      },
    ]);
    await teardownServer(server);
  },
});

Deno.test({
  name: "Application() throw an error for an unsupported driver",
  permissions: setupPermissions(),
  fn() {
    // Arrange
    const driver = "unsupported" as DriverStrategy;

    // Act & Assert
    assertThrows(
      () => new Application({ driver }),
      AssertionError,
      `Unsupported driver: ${driver}`,
    );
  },
});

Deno.test({
  name: "Application() supports custom hostname definitions",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const app = new Application({ logLevel: "CRITICAL" });
    app.registerVersion({
      version: "v1",
      controllers: [MessageController],
    });
    const hostname = "127.0.0.1";
    const server = await app.listen({ hostname, port: 0 });
    const origin = buildServerOrigin(server);
    const url = new URL("/v1/messages", origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.GET });

    // Assert
    assertStrictEquals(hostname, server.addr.hostname);
    assertStrictEquals(response.status, STATUS_CODE.OK);
    assertStrictEquals(response.statusText, STATUS_TEXT[STATUS_CODE.OK]);
    assertEquals(await response.json(), [
      {
        id: "1",
        content: "Hello",
      },
      {
        id: "2",
        content: "Hiya",
      },
    ]);
    await teardownServer(server);
  },
});

Deno.test({
  name:
    "Application.listen() listens using the default port 8080 if no port option defined",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const conflictingApp = new Application({ logLevel: "CRITICAL" });
    conflictingApp.registerVersion({
      version: "v1",
      controllers: [MessageController],
    });
    const app = new Application({ logLevel: "CRITICAL" });
    app.registerVersion({
      version: "v1",
      controllers: [MessageController],
    });
    const defaultPort = 8080;
    let conflictingServer: Server | undefined = undefined;
    try {
      conflictingServer = await conflictingApp.listen({ port: defaultPort });
    } catch {
      // Do nothing
    }

    // Act & Assert
    await assertRejects(() => app.listen(), Deno.errors.AddrInUse);
    if (conflictingServer) {
      await teardownServer(conflictingServer);
    }
  },
});

@Controller("/messages")
class MessageController implements Injectable {
  public register(): InjectableRegistration {
    return { dependencies: [] };
  }

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
