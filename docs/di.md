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

Why use dependency injection?

<!-- TODO: links and verify that this isn't nonsense.  -->

When developing services, it is good practice to use
[SOLID principles](https://en.wikipedia.org/wiki/SOLID) for the software
architecture. A big part of this is dependency injection which allows one to
define all the required dependencies for a service across the entire stack. As
part of this, software can be defined in a way that can scale in the future
while keeping things simple in the short and long-term.

A common issue with dependency injection is the magic nature of how it's set up.
Here we aim to rectify this by keeping any registrations of entities within the
container as close to the relevant definitions as possible. This can be achieved
through the use of type-safe decorators in combinations with TypeScript
interfaces. The following decorators will register services within the
container:

- `@Controller()`
- `@Service()`

For example, a controller can be defined as follows:

```ts
@Controller("/messages")
export class MessageController implements Injectable {
  constructor(messageService: MessageService) {}

  // Registration of this dependency is added within the class
  // and mandated by the presence of the Controller decorator.
  // As a function, users retain full flexibility for
  // registration of dependencies.
  public register(): InjectableRegistration {
    return { ctor: [MessageService] };
  }

  @Get({ path: "/", responseType: List(Message) })
  public getMessages(): Message[] {
    return [
      {
        id: "1",
        content: "Hello",
      },
      {
        id: "2",
        content: "Hiya",
      },
    ];
  }
}
```

It is then registered as part of an application version as follows:

```ts
const app = new Application();

app.registerVersion({
  version: "v1",
  controllers: [MessageController],
});
```

Similarly, a service can be defined as follows:

```ts
@Service()
class MessageService implements Injectable {
  #messageRepository: MessageRepositoryContract;

  constructor(messageRepository: MessageRepositoryContract) {
    this.#messageRepository = messageRepository;
  }

  public init(): InjectableInit {
    return { ctor: [{ class: MessageRepository }] };
  }

  public getMessages(): Message[] {
    return this.#messageRepository.getMessages();
  }
}
```
