// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import {
  ContainerError,
  Controller,
  Get,
  HttpMethod,
  type Injectable,
  type InjectableRegistration,
  type MaybePromise,
  Service,
} from "@eyrie/app";
import { assertEquals, assertRejects, assertStrictEquals } from "@std/assert";
import { STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { setupApplication, setupPermissions } from "./utils/setup_utils.ts";

Deno.test({
  name: "buildContainer() hooks up services using dependency injection",
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
    "buildContainer() throws a startup error when an unsupported registration is defined",
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
