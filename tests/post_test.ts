// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
} from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";
import { teardownServer } from "./utils/teardown_utils.ts";
import { HttpMethod } from "../router.ts";
import {
  Context,
  Controller,
  Field,
  type Injectable,
  type InjectableRegistration,
  InputType,
  Post,
} from "../mod.ts";

Deno.test({
  name: "Post() registers a POST route",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const [, server, origin] = await setupApplication([MessageController]);
    const url = new URL("/v1/messages", origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.POST });
    const text = await response.text();

    // Assert
    assertStrictEquals(response.status, STATUS_CODE.OK, text);
    assertStrictEquals(response.statusText, STATUS_TEXT[STATUS_CODE.OK], text);
    assertStrictEquals(text, "");
    await teardownServer(server);
  },
});

Deno.test({
  name: "Post() registers a POST route with a request body",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const [, server, origin] = await setupApplication([MessageController]);
    const url = new URL("/v1/messages/body", origin);
    const body: MessageInput = { text: "Hello" };
    const headers = new Headers({ "content-type": "application/json" });

    // Act
    const response = await fetch(url, {
      method: HttpMethod.POST,
      body: JSON.stringify(body),
      headers,
    });
    const text = await response.text();

    // Assert
    assertStrictEquals(response.status, STATUS_CODE.OK, text);
    assertStrictEquals(response.statusText, STATUS_TEXT[STATUS_CODE.OK], text);
    assertStrictEquals(text, "");
    await teardownServer(server);
  },
});

@InputType({ description: "Message Input" })
class MessageInput {
  @Field({ description: "The text of the message", type: String })
  text!: string;
}

@Controller("/messages")
class MessageController implements Injectable {
  public register(): InjectableRegistration {
    return { dependencies: [] };
  }

  @Post({ path: "/" })
  public sendEmptyMessage(ctx: Context, params: unknown, body: unknown): void {
    assertInstanceOf(ctx, Context);
    assertEquals(params, {});
    assert(body === undefined);
  }

  @Post({ path: "/body", body: MessageInput })
  public sendMessage(ctx: Context, params: unknown, body: MessageInput): void {
    assertInstanceOf(ctx, Context);
    assertEquals(params, {});
    assertInstanceOf(body, MessageInput);
    assertEquals({ ...body }, { text: "Hello" });
  }
}
