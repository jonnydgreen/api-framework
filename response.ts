// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import { eTag } from "@std/http/etag";
import { STATUS_CODE, STATUS_TEXT, type StatusCode } from "@std/http/status";
import type { Context } from "./context.ts";

// TODO: handle doc string

// TODO: follow RFC https://www.rfc-editor.org/rfc/rfc9457.html
export interface ErrorResponse {
  status: StatusCode;
  title: string;
  detail: string;
}
export function buildErrorResponse<E extends Error>(
  ctx: Context,
  error: unknown,
): [ErrorResponse, ResponseInit | undefined] {
  // TODO: type
  // TODO: instance
  // TODO: work out best way of exposing this
  const detail = (error instanceof Error ? error.message : undefined) ||
    String(error);
  // TODO: work out best way of customising this
  const status = getErrorStatusCode(error);
  // TODO: work out best way of customising this
  const title = STATUS_TEXT[status];
  const body: ErrorResponse = { status, title, detail };
  // TODO: JSON logs
  ctx.log.error(`Error running handler: ${detail}`);
  return [body, {
    headers: { "content-type": "application/problem+json" },
    status,
  }];
}

function getErrorStatusCode(error: unknown): StatusCode {
  if (error && typeof error === "object" || error instanceof Error) {
    if (
      "statusCode" in error && typeof error.statusCode === "number"
    ) {
      if (error.statusCode in STATUS_TEXT) {
        return error.statusCode as StatusCode;
      }
    }
  }
  return STATUS_CODE.InternalServerError;
}

export async function processResponse(
  ctx: Context,
  body: Response | object | BodyInit | null,
  init?: ResponseInit,
): Promise<Response> {
  if (body instanceof Response) {
    return body;
  }
  const bodyInit = serialiseResponseBody(ctx, body);
  const headers = await createHeaders(ctx, bodyInit, init);
  return new Response(bodyInit, { ...init, headers });
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
    const etag = await eTag(bodyInit);
    if (etag) {
      headers.set("etag", etag);
    }
  }
}

function serialiseResponseBody(
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
