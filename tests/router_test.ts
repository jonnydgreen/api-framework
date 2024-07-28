// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertRejects } from "@std/assert";
import type { Injectable, InjectableRegistration } from "../container.ts";
import { Controller, Get } from "../decorators.ts";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";

Deno.test({
  name:
    "Router() throws a route already registered error when a duplicate route is defined on the same controller",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    @Controller("/same-controller")
    class DuplicateSameController implements Injectable {
      public register(): InjectableRegistration {
        return { ctor: [] };
      }

      @Get({ path: "/duplicate" })
      public route1() {
        return "";
      }

      @Get({ path: "/duplicate" })
      public route2() {
        return "";
      }
    }

    // Act & Assert
    await assertRejects(() => setupApplication([DuplicateSameController]));
  },
});

Deno.test({
  name:
    "Router() throws a route already registered error when a duplicate route is defined on a different controller",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    @Controller("/different-controller")
    class DuplicateDifferentController1 implements Injectable {
      public register(): InjectableRegistration {
        return { ctor: [] };
      }

      @Get({ path: "/duplicate" })
      public route() {
        return "";
      }
    }
    @Controller("/different-controller")
    class DuplicateDifferentController2 implements Injectable {
      public register(): InjectableRegistration {
        return { ctor: [] };
      }

      @Get({ path: "/duplicate" })
      public route() {
        return "";
      }
    }

    // Act & Assert
    await assertRejects(() =>
      setupApplication([
        DuplicateDifferentController1,
        DuplicateDifferentController2,
      ])
    );
  },
});
