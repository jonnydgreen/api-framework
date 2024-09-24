// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import {
  type Context,
  Controller,
  Get,
  HttpMethod,
  type Injectable,
  type InjectableRegistration,
} from "@eyrie/app";
import { assertEquals, assertStrictEquals } from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http";
import type { ControllerHandlerInput } from "./utils/controller_utils.ts";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";

Deno.test({
  name: "Response() supports returning a Response instance in a handler",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const input: ControllerHandlerInput = {
      ctx: undefined,
      params: undefined,
    };
    const output = "hello";
    @Controller("/")
    class BasicController implements Injectable {
      public register(): InjectableRegistration {
        return { dependencies: [] };
      }

      @Get({ path: "/basic" })
      public getRoute(
        ctx: Context,
        params: unknown,
      ): unknown {
        input.ctx = ctx;
        input.params = params;
        return new Response(output);
      }
    }
    await using setup = await setupApplication([BasicController]);
    const url = new URL("/v1/basic", setup.origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.GET });

    // Assert
    assertStrictEquals(response.status, STATUS_CODE.OK);
    assertStrictEquals(response.statusText, STATUS_TEXT[STATUS_CODE.OK]);
    assertEquals(await response.text(), output);
  },
});
