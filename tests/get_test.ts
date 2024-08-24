// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertEquals, assertStrictEquals } from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";
import { createControllerWithGetRoute } from "./utils/controller_utils.ts";
import { HttpMethod } from "@eyrie/app";

Deno.test({
  name: "Get() registers a GET route",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const { controller } = createControllerWithGetRoute(
      "/messages",
      { path: "/" },
      () => [
        { id: "1", content: "Hello" },
        { id: "2", content: "Hiya" },
      ],
    );
    await using setup = await setupApplication([controller]);
    const url = new URL("/v1/messages", setup.origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.GET });

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
  },
});
