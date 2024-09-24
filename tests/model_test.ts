// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import {
  Field,
  FieldDecoratorError,
  type InjectableRegistration,
  ObjectType,
  Service,
} from "@eyrie/app";
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

Deno.test({
  name:
    "Field() throws an error when an incorrectly registered type is used as the type",
  permissions: setupPermissions(),
  fn() {
    assertThrows(
      () => {
        @Service()
        class UnregisteredType {
          register(): InjectableRegistration {
            return { dependencies: [] };
          }
        }

        @ObjectType({ description: "Message" })
        class Message {
          @Field({ description: "Hello", type: UnregisteredType })
          // Acceptable use of any for the purpose of this test
          // deno-lint-ignore no-explicit-any
          hello!: any;
        }

        // Act
        new Message();
      },
      FieldDecoratorError,
      "Field() registration failed for 'Message.hello': no validation schema exists for field type 'UnregisteredType'",
    );
  },
});

Deno.test({
  name:
    "Field() throws an error when applied to an incorrectly registered type",
  permissions: setupPermissions(),
  fn() {
    assertThrows(
      () => {
        @Service()
        class InvalidType {
          register(): InjectableRegistration {
            return { dependencies: [] };
          }

          @Field({ description: "Hello", type: String })
          hello!: string;
        }

        // Act
        new InvalidType();
      },
      FieldDecoratorError,
      "Field() registration failed for InvalidType.hello: no schema defined for 'InvalidType'",
    );
  },
});
