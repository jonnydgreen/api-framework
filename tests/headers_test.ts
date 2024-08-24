// // Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertStrictEquals } from "@std/assert";
import { eTag } from "@std/http/etag";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";
import { createControllerWithGetRoute } from "./utils/controller_utils.ts";
import { HttpMethod } from "@eyrie/app";

Deno.test({
  name: "Headers() returns an etag matching the response body",
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
    const text = await response.text();
    const etag = response.headers.get("etag");
    const calculatedEtag = await eTag(text);

    // Assert
    assertStrictEquals(etag, '"3a-4LK1qVw5XhkwLXL43X7Y0zU89+a"');
    assertStrictEquals(etag, calculatedEtag);
  },
});
