// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

@Controller("/messages")
export class MessageController {
  @Get({ responseType: List(Message) })
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
