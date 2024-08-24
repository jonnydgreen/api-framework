// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import {
  type ClassType,
  Context,
  Field,
  HttpMethod,
  InputType,
} from "@eyrie/app";
import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
} from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";
import { createControllerWithPostRoute } from "./utils/controller_utils.ts";

Deno.test({
  name: "Post() registers a POST route",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    const { controller, input } = createControllerWithPostRoute(
      "/messages",
      { path: "/" },
    );
    await using setup = await setupApplication([controller]);
    const url = new URL("/v1/messages", setup.origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.POST });
    const text = await response.text();

    // Assert
    assertStrictEquals(response.status, STATUS_CODE.OK, text);
    assertStrictEquals(response.statusText, STATUS_TEXT[STATUS_CODE.OK], text);
    assertStrictEquals(text, "");
    assertInstanceOf(input.ctx, Context);
    assertEquals(input.params, {});
    assert(input.body === undefined);
  },
});

[
  {
    test:
      "Post() registers a POST route with a request body containing a string scalar type field",
    testInput: <T extends ClassType>(): [T, InstanceType<T>] => {
      @InputType({ description: "Input" })
      class Input {
        @Field({ description: "String", type: String })
        string!: string;
      }
      const input: Input = { string: "Hello" };
      return [Input as T, input as InstanceType<T>];
    },
  },
  {
    test:
      "Post() registers a POST route with a request body containing a boolean scalar type field",
    testInput: <T extends ClassType>(): [T, InstanceType<T>] => {
      @InputType({ description: "Input" })
      class Input {
        @Field({ description: "Boolean", type: Boolean })
        boolean!: boolean;
      }
      const input: Input = { boolean: true };
      return [Input as T, input as InstanceType<T>];
    },
  },
  {
    test:
      "Post() registers a POST route with a request body containing a number scalar type field",
    testInput: <T extends ClassType>(): [T, InstanceType<T>] => {
      @InputType({ description: "Input" })
      class Input {
        @Field({ description: "Number", type: Number })
        number!: number;
      }
      const input: Input = { number: 7 };
      return [Input as T, input as InstanceType<T>];
    },
  },
  {
    test:
      "Post() registers a POST route with a request body containing a nested object type field",
    testInput: <T extends ClassType>(): [T, InstanceType<T>] => {
      @InputType({ description: "NestedInput" })
      class NestedInput {
        @Field({ description: "Nested String", type: String })
        string!: string;
      }
      @InputType({ description: "Input" })
      class Input {
        @Field({ description: "NestedInput", type: NestedInput })
        nested!: NestedInput;
      }
      const input: Input = { nested: { string: "Hello nested!" } };
      return [Input as T, input as InstanceType<T>];
    },
  },
  {
    test:
      "Post() registers a POST route with a request body containing multiple type fields",
    testInput: <T extends ClassType>(): [T, InstanceType<T>] => {
      @InputType({ description: "NestedInput" })
      class NestedInput {
        @Field({ description: "Nested String", type: String })
        nestedString!: string;
        @Field({ description: "Nested Number", type: Number })
        nestedNumber!: number;
        @Field({ description: "Nested Boolean", type: Boolean })
        nestedBoolean!: boolean;
      }
      @InputType({ description: "Input" })
      class Input {
        @Field({ description: "String", type: String })
        string!: string;
        @Field({ description: "Boolean", type: Boolean })
        boolean!: boolean;
        @Field({ description: "Number", type: Number })
        number!: number;
        @Field({ description: "NestedInput", type: NestedInput })
        nested!: NestedInput;
      }
      const input: Input = {
        string: "Hello root!",
        boolean: true,
        number: 7,
        nested: {
          nestedString: "Hello nested!",
          nestedNumber: 8,
          nestedBoolean: false,
        },
      };
      return [Input as T, input as InstanceType<T>];
    },
  },
].forEach(({ test, testInput }) => {
  Deno.test({
    name: test,
    permissions: setupPermissions(),
    async fn() {
      // Arrange
      const [Input, inputBody] = testInput();
      const { controller, input } = createControllerWithPostRoute(
        "/messages",
        { path: "/", body: Input },
      );
      await using setup = await setupApplication([controller]);
      const url = new URL("/v1/messages", setup.origin);
      const headers = new Headers({ "content-type": "application/json" });

      // Act
      const response = await fetch(url, {
        method: HttpMethod.POST,
        body: JSON.stringify(inputBody),
        headers,
      });
      const text = await response.text();

      // Assert
      assertStrictEquals(response.status, STATUS_CODE.OK, text);
      assertStrictEquals(
        response.statusText,
        STATUS_TEXT[STATUS_CODE.OK],
        text,
      );
      assertStrictEquals(text, "");
      assertInstanceOf(input.ctx, Context);
      assertEquals(input.params, {});
      assertInstanceOf(input.body, Input);
      assertEquals(JSON.parse(JSON.stringify(input.body)), inputBody);
    },
  });
});
