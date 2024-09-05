import { OpenAPI310 } from "../interfaces/open-api.interface.ts";

export const validateOpenApi = (openAPISpec: OpenAPI310): void => {
  // Validate the OpenAPI spec here
  console.log("Validating OpenAPI spec...");

  checkPathNames(openAPISpec.paths);
};

/*
 * Check if the path names in the OpenAPI spec are valid.
 * They must start with a forward slash (/) and not contain any whitespace.
 */
function checkPathNames(
  paths: OpenAPI310["paths"],
) {
  throw new Error("Function not implemented.");
}
