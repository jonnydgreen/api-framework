// // Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertStrictEquals } from "@std/assert";
import { calculate } from "@std/http/etag";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";
import { teardownServer } from "./utils/teardown_utils.ts";
import { Controller, Get } from "../decorators.ts";
import type { Injectable, InjectableRegistration } from "../registration.ts";
import { HttpMethod } from "../router.ts";

Deno.test({
  name: "Headers() returns an etag matching the response body",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const [, server, origin] = await setupApplication([MessageController]);
    const url = new URL("/v1/messages", origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.GET });
    const text = await response.text();
    const etag = response.headers.get("etag");
    const calculatedEtag = await calculate(text);

    // Assert
    assertStrictEquals(etag, '"3a-4LK1qVw5XhkwLXL43X7Y0zU89+a"');
    assertStrictEquals(etag, calculatedEtag);
    await teardownServer(server);
  },
});

@Controller("/messages")
class MessageController implements Injectable {
  public register(): InjectableRegistration {
    return { ctor: [] };
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
