// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { Controller, Get } from "../../decorators.ts";

@Controller("/messages")
export class MessageController {
  // TODO: uncomment
  // @Get({ responseType: List(Message) })
  @Get({ path: "/" })
  // public getMessages(): Message[] {
  public getMessages() {
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

// TODO: fine for now
// This is here because it triggers the decorator instantiations
// which is needs to set everything up
// deno-lint-ignore no-unused-vars
const m = new MessageController();
