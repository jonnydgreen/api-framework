import { Field, ObjectType } from "./types.ts";

@ObjectType()
export class Hello {
  @Field({ type: String })
  public name!: string;

  @Field({ type: Number })
  public address!: number;

  @Field({ type: Boolean })
  public isCool!: boolean;
}
