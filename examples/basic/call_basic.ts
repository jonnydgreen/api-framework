// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";

const url = new URL("v1/messages", "http://localhost:8080");
const method = "GET";

console.error(`Calling ${method} ${url}`);
const response = await fetch(url, { method });

const details = {
  status: response.status,
  statusText: response.statusText,
  headers: response.headers,
  text: await response.text(),
};

assertEquals(response.status, 200, JSON.stringify(details));
console.error(details);
