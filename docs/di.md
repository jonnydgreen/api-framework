# Dependency Injection

## Open Questions

Are there third party packages that can help with dependency injection that use
the stage 3 syntax?

Possible options:

- Node.js Framework: https://github.com/tsedio/tsed (unsure if it supports
  stage-3 decorators and seems overkill to use as a DI container)
- InversifyJS - (unsure if it supports stage-3 decorators and it requires
  reflect-metadata)
- DI: https://deno.land/x/di@v0.1.1 - seems unsupported
- Inject: https://deno.land/x/inject@v0.1.2 - seems unsupported

Based on the above it is recommend to use our own DI container solution.

## Principles

- Provide a minimal ways to inject dependencies rather than multiple ways:
  - This avoid confusion in implementation
  - Ensures consistency of code
  - Makes code generation a reality
  - Avoid black-box magic where possible
