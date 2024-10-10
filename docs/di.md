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

**Why use dependency injection?**

When developing services, it is good practice to use
[SOLID principles](https://en.wikipedia.org/wiki/SOLID) for the software
architecture. The reason for this is to ensure the code that is written is clear
and maintainable. It also ensures the codebase can be developed by multiple
users at once which is crucial for team or even multiple team environments.

A big part of this is Dependency Injection (DI) which allows one to define all
the required dependencies for a service across the entire stack. With this in
place, software can be defined in a way that can scale in the future while
keeping things simple in the short and long-term.

A common pitfall with dependency injection is the magic nature of how it's set
up in the library and the usage of it. Too often do developers come up against
the mystery that is incorrectly defined dependency injection!

Here, we aim to rectify this by keeping every close to source. For example,
registrations of entities within the container are defined as close to the
relevant definitions as possible. This can be achieved through the use of
type-safe decorators in combination with TypeScript interfaces. The following
decorators will register services within the DI container:

- `@Controller()`
- `@Service()`

For example, a controller can be defined as follows:

```ts
import type { Message } from "@examples/di/di_model.ts";
import { MessageService } from "@examples/di/di_service.ts";
import {
  Controller,
  Get,
  type Injectable,
  type InjectableRegistration,
} from "@eyrie/app";

@Controller("/messages")
export class MessageController implements Injectable {
  readonly #messageService: MessageService;

  constructor(messageService: MessageService) {
    this.#messageService = messageService;
  }

  // Registration of this dependency is added within the class
  // and mandated by the presence of the `Controller` decorator.
  // As a function or promise, users retain full flexibility for
  // registration of dependencies.
  public register(): InjectableRegistration {
    return { dependencies: [{ class: MessageService }] };
  }

  @Get({ path: "/" })
  public getLatestMessage(): Message {
    return this.#messageService.getLatestMessage();
  }
}
```

And the dependency can be defined with the `Service` decorator:

```ts
import type { Message } from "@examples/di/di_model.ts";
import {
  type Injectable,
  type InjectableRegistration,
  type MaybePromise,
  Service,
} from "@eyrie/app";

@Service()
export class MessageService implements Injectable {
  // Registration of this dependency is added within the class
  // and mandated by the presence of the `Service` decorator.
  // As a function or promise, users retain full flexibility for
  // registration of dependencies.
  public register(): MaybePromise<InjectableRegistration> {
    return { dependencies: [] };
  }

  public getLatestMessage(): Message {
    return {
      id: "1",
      content: "Hello",
    };
  }
}
```

It is then registered as part of an application version as follows:

```ts ignore
import { Application } from "@eyrie/app";
import { MessageController } from "@examples/di/di_controller.ts";

const app = new Application();

app.registerVersion({
  version: "v1",
  controllers: [MessageController],
});

await app.listen();
```
