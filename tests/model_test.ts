// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { Field, FieldDecoratorError, ObjectType } from "@eyrie/app";
import {
  assertInstanceOf,
  assertStrictEquals,
  assertThrows,
} from "@std/assert";
import { setupPermissions } from "./utils/setup_utils.ts";

Deno.test({
  name: "Field() throws an error when applied to a static field",
  permissions: setupPermissions(),
  fn() {
    const error = assertThrows(() => {
      // Arrange
      class Message {
        @Field({ description: "Static hello", type: String })
        static hello: string;
      }

      // Act
      new Message();
    });

    // Assert
    assertInstanceOf(error, Error);
    assertInstanceOf(error, FieldDecoratorError);
    assertStrictEquals(
      error.message,
      "Field() registration failed for 'Message.hello': static field registration is unsupported",
    );
  },
});

Deno.test({
  name: "Field() throws an error when applied to a static field",
  permissions: setupPermissions(),
  fn() {
    const error = assertThrows(() => {
      // Arrange
      class Message {
        @Field({ description: "Private hello", type: String })
        #hello!: string;
      }

      // Act
      new Message();
    });

    // Assert
    assertInstanceOf(error, Error);
    assertInstanceOf(error, FieldDecoratorError);
    assertStrictEquals(
      error.message,
      "Field() registration failed for 'Message.#hello': private field registration is unsupported",
    );
  },
});

Deno.test({
  name: "Field() throws an error when an unsupported type name is provided",
  permissions: setupPermissions(),
  fn() {
    // Arrange
    class UnsupportedString extends String {}
    const error = assertThrows(() => {
      @ObjectType({ description: "Message" })
      class Message {
        @Field({ description: "Private hello", type: UnsupportedString })
        hello!: string;
      }

      // Act
      new Message();
    });

    // Assert
    assertInstanceOf(error, Error);
    assertInstanceOf(error, FieldDecoratorError);
    assertStrictEquals(
      error.message,
      "Field() registration failed for 'Message.hello': unsupported type name 'UnsupportedString'",
    );
  },
});
