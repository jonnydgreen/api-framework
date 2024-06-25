// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
// TODO: refine docs and error

export function assertNever(_input: never, message: string): never {
  throw new Error(message);
}
