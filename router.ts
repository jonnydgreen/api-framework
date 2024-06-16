// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: doc-strings with full examples

export function getControllerRoutes(_controller: unknown): ControllerRoute[] {
  return [{
    method: "GET",
    path: "/messages",
    handler(ctx) {
      ctx.response.body = `<!DOCTYPE html>
      <html>
        <head><title>Hello there!</title><head>
        <body>
          <h1>Hello there!</h1>
        </body>
      </html>
    `;
    },
  }];
}

export type HttpMethod = "GET";

export interface ControllerRoute {
  method: HttpMethod;
  path: `/${string}`;
  // TODO: fix-up handler to something sensible
  // deno-lint-ignore no-explicit-any
  handler(...args: any[]): void | Promise<void>;
}
