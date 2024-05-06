import { assert } from "https://deno.land/std@0.127.0/_util/assert.ts";
import { Field, ObjectType } from "./types.ts";

@ObjectType()
export class Nested {
  @Field({ type: String })
  public foo!: string;
}

@ObjectType()
export class Hello {
  @Field({ type: String })
  public name!: string;

  @Field({ type: String })
  public address!: string;

  @Field({ type: Boolean })
  public isCool!: boolean;

  @Field({ type: Nested })
  public nested!: Nested;
}

const a: Hello = {
  name: "",
  address: "",
  isCool: true,
  nested: {
    foo: "",
  },
};
assert(a);
