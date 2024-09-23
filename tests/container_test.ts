// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import {
  ContainerError,
  Controller,
  Get,
  getRegistrationKey,
  HttpMethod,
  type Injectable,
  type InjectableRegistration,
  type MaybePromise,
  Service,
} from "@eyrie/app";
import {
  assertEquals,
  assertRejects,
  assertStrictEquals,
  assertThrows,
} from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";

Deno.test({
  name:
    "Container.getClassMethod() throws an when no method function exists for a class",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    @Controller("/no-method-fn")
    class NoMethodFnController implements Injectable {
      register(): MaybePromise<InjectableRegistration> {
        return {
          dependencies: [],
        };
      }
    }
    await using app = await setupApplication([NoMethodFnController]);
    const key = getRegistrationKey(NoMethodFnController);
    const method = "unknown";

    // Act & Assert
    assertThrows(
      () => app.application.container.getClassMethod(key, method),
      ContainerError,
      `Container build failed for ${key.description}.${method}: no method ${method} exists for class ${key.description}`,
    );
  },
});

Deno.test({
  name:
    "Container.buildContainer() hooks up services using dependency injection",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    await using setup = await setupApplication([MessageController]);
    const url = new URL("/v1/messages", setup.origin);

    // Act
    const response = await fetch(url, { method: HttpMethod.GET });

    // Assert
    assertStrictEquals(response.status, STATUS_CODE.OK);
    assertStrictEquals(response.statusText, STATUS_TEXT[STATUS_CODE.OK]);
    assertEquals(await response.json(), [
      {
        id: "1",
        content: "Hello",
      },
      {
        id: "2",
        content: "Container says hiya",
      },
    ]);
  },
});

Deno.test({
  name:
    "Container.buildContainer() throws a startup error when an unsupported registration is defined",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    @Controller("/unsupported")
    class UnsupportedController implements Injectable {
      public register(): MaybePromise<InjectableRegistration> {
        return {
          // deno-lint-ignore no-explicit-any
          dependencies: [{ unsupported: "blah" } as any],
        };
      }
    }

    // Act & Assert
    await assertRejects(
      () => setupApplication([UnsupportedController]),
      ContainerError,
      `Unable to register UnsupportedController: unsupported parameter definition at position 0`,
    );
  },
});

Deno.test({
  name:
    "Container.buildContainer() throws a startup error when an unsupported registration is defined",
  permissions: setupPermissions(),
  async fn() {
    // Arrange
    @Controller("/unsupported")
    class UnsupportedController implements Injectable {
      public register(): MaybePromise<InjectableRegistration> {
        return {
          // deno-lint-ignore no-explicit-any
          dependencies: [{ unsupported: "blah" } as any],
        };
      }
    }

    // Act & Assert
    await assertRejects(
      () => setupApplication([UnsupportedController]),
      ContainerError,
      `Unable to register UnsupportedController: unsupported parameter definition at position 0`,
    );
  },
});

@Controller("/messages")
class MessageController implements Injectable {
  #messageService: MessageService;

  constructor(messageService: MessageService) {
    this.#messageService = messageService;
  }

  public register(): InjectableRegistration {
    return { dependencies: [{ class: MessageService }] };
  }

  @Get({ path: "/" })
  public getMessages() {
    return this.#messageService.getMessages();
  }
}

@Service()
class MessageService implements Injectable {
  #messageRepository: MessageRepositoryContract;

  constructor(messageRepository: MessageRepositoryContract) {
    this.#messageRepository = messageRepository;
  }

  public register(): InjectableRegistration {
    return { dependencies: [{ class: MessageRepository }] };
  }

  public getMessages(): Message[] {
    return this.#messageRepository.getMessages();
  }
}

interface MessageRepositoryContract {
  getMessages(): Message[];
}

interface Message {
  id: string;
  content: string;
}

@Service()
class MessageRepository implements Injectable, MessageRepositoryContract {
  public register(): InjectableRegistration {
    return { dependencies: [] };
  }

  public getMessages(): Message[] {
    return [
      {
        id: "1",
        content: "Hello",
      },
      {
        id: "2",
        content: "Container says hiya",
      },
    ];
  }
}
