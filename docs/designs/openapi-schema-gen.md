# OpenAPI Schema Generator design

One of the main goals of the project is to support the
[OpenAPI spec](https://swagger.io/specification/). API Framework is going for a
code-first approach to generating OpenAPI schemas. You define your routes,
controllers, models, etc and the API Framework CLI tool will generate a valid
OpenAPI-compliant schema that clients can consume. This is as opposed to
schema-first approach to building OpenAPI servers.

## Principles

The following principles should be followed when designing the OpenAPI Schema
Generator:

- [ ] Only generate valid OpenAPI schemas
- [ ] Fast
- [ ] Watch-mode
- [ ] Majority of it is framework agnostic
- [ ] CLI entry-point
- [ ] Start with basic OpenAPI schema feature support and grow with time
- [ ] Follow [OpenAPI best practices](https://learn.openapis.org/best-practices)
- [ ] Only supports generating the current latest version of OpenAPI schema w/
      newer versions being added as they are released
- [ ] Support JSON format only
- [ ] Use Object References as much as possible
- [ ] Zero runtime errors, every step is type-safe and makes run times errors
      exceptional

## Design

The OpenAPI spec generator will be split into a few parts:

1. API Framework interface
   1. This is an interface that the framework controls. This will give
      downstream consumers a way to grab all needed objects. For example,
      `apiFrameworkApp.controllers` would give all controllers for the current
      application controllers.
   2. Subject to change over time as the framework grows
2. OpenAPI spec interface
   1. This is the interface that defines a valid OpenAPI spec
   2. Seperate interface for each OpenAPI spec version
3. API Framework interface to OpenAPI spec interface transformer
   1. The connective tissue between the API framework and OpenAPI spec
   2. In theory, if one of the two sides changes, this class would be the only
      thing to change
4. Open API spec validator
   1. TypeScript cannot validate full values within the generated OpenAPI spec.
      There are some rules which must be captured at runtime.
5. File Writer
   1. Generic class which can take in any object and write it as a JSON file
   2. Writes the final OpenAPI spec object to a JSON file
6. Watcher
   1. Watches for changes in a developers application code and will re-run a
      module, e.g. `index.ts` file
   2. When quickly iterating on an OpenAPI spec, it is ideal to have the OpenAPI
      spec gen run on every file change
7. Guide
   1. A written guide on how to build an example OpenAPI spec generator
   2. Goes over the steps needed to perform building the API framework object
      and then emitting the file
   3. Could be replaced with a CLI in the future

### Example Guide

```ts
const apiFrameworkApp: APIFrameworkInterface = buildApp(controllers);

const openAPISpec: OpenAPISpecInterface = buildOpenAPISpecFromAPIFrameworkApp(
   apiFrameworkApp,
   {
      version: OpenAPISpecVersions.OpenAPISpecVersion310,
   },
);

writeObjectToJSONFile(openAPISpec);
```
