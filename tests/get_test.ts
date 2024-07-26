import { assertEquals, assertStrictEquals } from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { Application } from "../application.ts";
import { Controller, Get } from "../decorators.ts";
import type { Server } from "../platforms/platform.ts";

Deno.test({
  name: "Get() registers a GET route",
  permissions: { net: true },
  async fn() {
    // Arrange
    const [, server] = createApplication();
    const url = getServerUrl(server, "/v1/messages");

    // Act
    const response = await fetch(url, { method: "GET" });

    // Assert
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

function createApplication(): [application: Application, server: Server] {
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

  const app = new Application({ logLevel: "CRITICAL" });
  new MessageController();

  app.registerVersion({
    version: "v1",
    controllers: [MessageController],
  });

  return [app, app.listen({ port: 0 })];
}

function teardownServer(server: Server): Promise<void> {
  server.shutdown();
  return server.finished;
}

function getServerUrl(server: Server, path: string): URL {
  return new URL(
    path,
    `http://${server.addr.hostname}:${server.addr.port}`,
  );
}
