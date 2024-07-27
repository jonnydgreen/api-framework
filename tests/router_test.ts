// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertEquals, assertStrictEquals } from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";
import { teardownServer } from "./utils/teardown_utils.ts";
import { Controller, Get } from "../decorators.ts";
import type { Injectable, InjectableRegistration } from "../kernel.ts";
import { ErrorResponse } from "../response.ts";
import { HttpMethod } from "../router.ts";

Deno.test({
  name:
    "router() returns an RFC-9457 compliant error when the handler throws an error",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const [, server, origin] = await setupApplication([MessageController]);
    const url = new URL("/v1/error", origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.GET });

    // Assert
    assertStrictEquals(response.status, STATUS_CODE.InternalServerError);
    assertStrictEquals(
      response.statusText,
      STATUS_TEXT[STATUS_CODE.InternalServerError],
    );
    assertEquals(await response.json(), {
      detail: "kaboom",
      status: 500,
      title: "Internal Server Error",
    });
    await teardownServer(server);
  },
});

Deno.test({
  name:
    "router() returns an RFC-9457 compliant Not Found error when a route path is not registered",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const [, server, origin] = await setupApplication([MessageController]);
    const url = new URL("/v1/not-found", origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.GET });

    // Assert
    assertStrictEquals(response.status, STATUS_CODE.NotFound);
    assertStrictEquals(response.statusText, STATUS_TEXT[STATUS_CODE.NotFound]);
    assertEquals(await response.json(), {
      detail: "Route GET /v1/not-found not found",
      status: 404,
      title: "Not Found",
    });
    await teardownServer(server);
  },
});

// TODO: should this be a method not supported error instead?
Deno.test({
  name:
    "router() returns an RFC-9457 compliant Not Found error when a route method is not registered for a registered path",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const [, server, origin] = await setupApplication([MessageController]);
    const url = new URL("/v1/error", origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.POST });

    // Assert
    assertStrictEquals(response.status, STATUS_CODE.NotFound);
    assertStrictEquals(response.statusText, STATUS_TEXT[STATUS_CODE.NotFound]);
    assertEquals<ErrorResponse>(await response.json(), {
      detail: "Route POST /v1/error not found",
      status: 404,
      title: "Not Found",
    });
    await teardownServer(server);
  },
});

@Controller("/error")
class MessageController implements Injectable {
  public register(): InjectableRegistration {
    return { ctor: [] };
  }

  @Get({ path: "/" })
  public throw() {
    throw new Error("kaboom");
  }
}
