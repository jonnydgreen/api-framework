# How-To create a basic RESTful API

<!-- TODO: add links for concepts -->
<!-- TODO: add relevant concepts for each stage to find out more -->

## Concepts

- Create a basic RESTful API

## Overview

Create the application. An application is always your starting point from which
everything steams from.

```ts
// app.ts
const app = new Application();

app.listen();
```

Before registering a route, you must setup everything associated with it. Here,
we start by defining the relevant types.

```ts
// message.ts
@ObjectType()
export class Message {
  @Field({ description: "The ID of the Message.", type: String })
  id: string;

  @Field({ description: "The text content of the Message.", type: String })
  content: string;
}
```

We then use these types to register the route. To register a route, you must
provision a controller which is responsible for the associated entity. In this
case, we create a message controller that registers the `GET /v1/messages`
endpoint.

```ts
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
```

Finally, spin up your application as follows:

```bash
deno run --allow-net app.ts
```

<!-- TODO: link -->

And separately, call it with a client of your choice. Here, we can cURL:

```bash
curl http://localhost:3000/v1/messages
```

If successful, you will receive the following output:

```json
[{ "id": "1", "content": "Hello" }, { "id": "2", "content": "Hiya" }]
```
