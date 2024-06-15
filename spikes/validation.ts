// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assert } from "jsr:@std/assert@^0.222.1/assert";
import { getTypeInfo } from "./types.ts";
import { Hello as V1Hello } from "./v1-hello.ts";
import { Hello as V2Hello } from "./v2-hello.ts";

const helloV1 = getTypeInfo(V1Hello);
const helloV2 = getTypeInfo(V2Hello);

assert(
  helloV1.key !== helloV2.key,
  "Hello V1 and Hello V2 keys must be unique",
);

try {
  console.log("Parsing Hello V1 using key:", helloV1.key);
  helloV1.schema.parse({
    name: "name",
    address: "address", // Should be a number
    isCool: true,
  });
  throw new Error("Hello V1 should error");
} catch (error) {
  console.log("Validation error:", String(error));
  const { issues } = error;
  assert(issues.length === 1);
  assert(issues[0].message === "Expected number, received string");
}

try {
  console.log("Parsing Hello V2 using key:", helloV2.key);
  helloV2.schema.parse({
    name: "name",
    address: 2, // Should be a string
    isCool: true,
    nested: {
      foo: 1,
    },
  });
  throw new Error("Hello V2 should error");
} catch (error) {
  console.log("Validation error:", String(error));
  const { issues } = error;
  assert(issues.length === 2);
  assert(issues[0].message === "Expected string, received number");
  assert(issues[1].message === "Expected string, received number");
  assert(issues[1].path[0] === "nested");
  assert(issues[1].path[1] === "foo");
}
