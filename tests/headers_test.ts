// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertStrictEquals } from "@std/assert";
import { calculate } from "@std/http/etag";
import { setupApplication } from "./utils/setup_utils.ts";
import { teardownServer } from "./utils/teardown_utils.ts";

Deno.test({
  name: "Headers returns an etag matching the response body",
  permissions: { net: true },
  async fn() {
    // Arrange
    const [, server, origin] = setupApplication();
    const url = new URL("/v1/messages", origin);

    // Act
    const response = await fetch(url, { method: "GET" });
    const text = await response.text();
    const etag = response.headers.get("etag");
    const calculatedEtag = await calculate(text);

    // Assert
    assertStrictEquals(etag, '"3a-4LK1qVw5XhkwLXL43X7Y0zU89+a"');
    assertStrictEquals(etag, calculatedEtag);
    await teardownServer(server);
  },
});
