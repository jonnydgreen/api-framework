// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: doc-strings

import type {
  ApplicationListenOptions,
  ApplicationVersionOptions,
} from "../application.ts";

export interface Platform {
  registerVersion(options: Required<ApplicationVersionOptions>): void;
  listen(options: Required<ApplicationListenOptions>): Promise<void>;
}
