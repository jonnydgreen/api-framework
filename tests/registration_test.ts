import { Controller, RegistrationError } from "@eyrie/app";
import { assertRejects } from "@std/assert";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";

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
