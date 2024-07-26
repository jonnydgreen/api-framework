// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertEquals, assertStrictEquals } from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";
import { teardownServer } from "./utils/teardown_utils.ts";

Deno.test({
  name: "Get() registers a GET route",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const [, server, origin] = setupApplication();
    const url = new URL("/v1/messages", origin);

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