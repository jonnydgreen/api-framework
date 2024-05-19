// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.
import { assert } from "https://deno.land/std@0.127.0/_util/assert.ts";

export class Application {
  public listen(options?: ApplicationOptions): Promise<void> {
    this.#server = Deno.serve({
      port: options?.port ?? 8000,
      hostname: options?.hostname ?? "0.0.0.0",
      handler: this.#handler.bind(this),
      onListen: this.#onListen.bind(this),
    });
    return this.finished;
  }

  /**
   * A promise that resolves once the application finishes - eg. when aborted using the signal passed to ServeOptions.signal.
   */
  public get finished(): Promise<void> {
    this.#assertStarted(this.#server);
    return this.#server.finished;
  }

  /**
   * Make the application block the event loop from finishing.
   *
   * Note: the application blocks the event loop from finishing by default. This method is only meaningful after .unref() is called.
   */
  public ref(): void {
    this.#assertStarted(this.#server);
    return this.#server.ref();
  }

  /**
   * @returns
   */
  public unref(): void {
    this.#assertStarted(this.#server);
    return this.#server.unref();
  }

  #server?: Deno.HttpServer;

  #assertStarted(
    server: Deno.HttpServer | undefined,
  ): asserts server is Deno.HttpServer {
    assert(
      server,
      "Application is not yet started. Please start by calling: .serve()",
    );
  }

  #handler(
    _request: Request,
    _info: Deno.ServeHandlerInfo,
  ): Response | Promise<Response> {
    return new Response("Not found", {
      status: 404,
    });
  }

  #onListen(localAddr: Deno.NetAddr): void {
    console.log({
      message: `Listening on http://${localAddr.hostname}:${localAddr.port}`,
    });
  }
}

export interface ApplicationOptions {
  /** The port to listen on.
   *
   * @default {8000} */
  port?: number;

  /** A literal IP address or host name that can be resolved to an IP address.
   *
   * __Note about `0.0.0.0`__ While listening `0.0.0.0` works on all platforms,
   * the browsers on Windows don't work with the address `0.0.0.0`.
   * You should show the message like `server running on localhost:8080` instead of
   * `server running on 0.0.0.0:8080` if your program supports Windows.
   *
   * @default {"0.0.0.0"} */
  hostname?: string;
}
