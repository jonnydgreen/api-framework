// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: doc-strings with full examples

export function getControllerRoutes(_controller: unknown): ControllerRoute[] {
  return [{
    method: "GET",
    path: "/messages",
    handler(): Response {
      return new Response(
        `<!DOCTYPE html>
      <html>
        <head><title>Hello there!</title><head>
        <body>
          <h1>Hello there!</h1>
        </body>
      </html>
    `,
        { status: 200 },
      );
    },
  }];
}

export type HttpMethod = "GET";

export interface Context {
  request: Request;
}

export interface ControllerRoute {
  method: HttpMethod;
  path: `/${string}`;
  handler(
    ctx: Context,
    params: Record<string, string | undefined>,
  ): Response | Promise<Response>;
}
