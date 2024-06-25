// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

@ObjectType()
export class Message {
  @Field({ description: "The ID of the Message.", type: String })
  id!: string;

  @Field({ description: "The text content of the Message.", type: String })
  content!: string;
}
