// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import {
  Controller,
  getClassRegistrationByKey,
  type Injectable,
  type InjectableRegistration,
  type MaybePromise,
  RegistrationError,
} from "@eyrie/app";
import { assertRejects, assertThrows } from "@std/assert";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";

Deno.test({
  name: "getClassRegistrationByKey()",
  permissions: setupPermissions(),
  fn() {
    // Arrange
    const key = Symbol("unknown");

    // Act & Assert
    assertThrows(
      () => getClassRegistrationByKey(key),
      RegistrationError,
      `Class is not registered for key: ${key.description}`,
    );
  },
});

Deno.test({
  name: "getRegistrationKey()",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    class NotRegistered implements Injectable {
      register(): MaybePromise<InjectableRegistration> {
        return {
          dependencies: [],
        };
      }
    }

    // Act & Assert
    await assertRejects(
      () => setupApplication([NotRegistered]),
      RegistrationError,
      "Cannot get class key: NotRegistered has not been registered",
    );
  },
});

Deno.test({
  name: "getRegistrationDefinition()",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    @Controller("/no-registration-definition")
    class NoRegistrationDefinition {
      // Acceptable use of any for this test
      // deno-lint-ignore no-explicit-any
      register: any = undefined;
    }

    // Act & Assert
    await assertRejects(
      () => setupApplication([NoRegistrationDefinition]),
      RegistrationError,
      "No registration function register() defined for injectable: NoRegistrationDefinition",
    );
  },
});
