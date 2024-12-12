// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

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
