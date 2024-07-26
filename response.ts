// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import { calculate } from "jsr:@std/http/etag";
import { Context } from "./logger.ts";

// TODO: handle doc string

export async function handleResponse(
  ctx: Context,
  body: Response | Promise<Response> | object | BodyInit | null,
  init?: ResponseInit,
): Promise<Response> {
  let response: Response;
  if (body instanceof Promise) {
    response = await body;
  } else if (body instanceof Response) {
    response = body;
  } else {
    const bodyInit = serialiseBody(ctx, body);
    const headers = await createHeaders(ctx, bodyInit, init);
    response = new Response(bodyInit, { ...init, headers });
  }
  return response;
}

async function createHeaders(
  _ctx: Context,
  bodyInit: BodyInit | null | undefined,
  init: ResponseInit | undefined,
): Promise<Headers> {
  const headers = new Headers(init?.headers);

  await createEtagHeader(bodyInit, headers);

  return headers;
}

async function createEtagHeader(
  bodyInit: BodyInit | null | undefined,
  headers: Headers,
): Promise<void> {
  if (typeof bodyInit === "string") {
    const etag = await calculate(bodyInit);
    if (etag) {
      headers.set("etag", etag);
    }
  }
}

function serialiseBody(
  _ctx: Context,
  body: object | BodyInit | null | undefined,
): BodyInit | null | undefined {
  let bodyInit: BodyInit | null | undefined = undefined;
  if (typeof body === "string") {
    bodyInit = body;
  } else if (typeof body === "object") {
    // TODO: handle content types here
    bodyInit = JSON.stringify(body);
  }
  return bodyInit;
}
