// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertEquals, assertStrictEquals } from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";
import {
  Controller,
  Get,
  HttpMethod,
  type Injectable,
  type InjectableRegistration,
} from "@eyrie/app";
// TODO: get from app
import type { ErrorResponse } from "../response.ts";

Deno.test({
  name:
    "buildErrorResponse() returns an RFC-9457 compliant error when the handler throws an error",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    await using setup = await setupApplication([MessageController]);
    const url = new URL("/v1/error", setup.origin);

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
  },
});

Deno.test({
  name:
    "buildErrorResponse() returns an RFC-9457 compliant error when the handler throws a string error",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    await using setup = await setupApplication([MessageController]);
    const url = new URL("/v1/error-string", setup.origin);

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
  },
});

Deno.test({
  name:
    "buildErrorResponse() returns an RFC-9457 compliant Not Found error when a route path is not registered",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    await using setup = await setupApplication([MessageController]);
    const url = new URL("/v1/not-found", setup.origin);

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
  },
});

// TODO(jonnydgreen): should this be a method not supported error instead?
Deno.test({
  name:
    "buildErrorResponse() returns an RFC-9457 compliant Not Found error when a route method is not registered for a registered path",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    await using setup = await setupApplication([MessageController]);
    const url = new URL("/v1/error", setup.origin);

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
  },
});

@Controller("/")
class MessageController implements Injectable {
  public register(): InjectableRegistration {
    return { dependencies: [] };
  }

  @Get({ path: "/error" })
  public throwError() {
    throw new Error("kaboom");
  }

  @Get({ path: "/error-string" })
  public throwErrorString() {
    throw "kaboom";
  }
}
