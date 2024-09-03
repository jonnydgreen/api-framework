// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import {
  Controller,
  Get,
  type Injectable,
  type InjectableRegistration,
} from "@eyrie/app";
import type { Message } from "./basic_model.ts";

@Controller("/messages")
export class MessageController implements Injectable {
  register(): InjectableRegistration {
    return { dependencies: [] };
  }

  // TODO(jonnydgreen): uncomment
  // @Get({ responseType: List(Message) })
  @Get({ path: "/" })
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
