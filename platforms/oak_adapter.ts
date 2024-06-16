// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO: doc-strings with full examples

import { Application, ApplicationListenEvent } from "@oak/oak/application";
import { Router } from "@oak/oak/router";
import type {
  ApplicationListenOptions,
  ApplicationVersionOptions,
} from "../application.ts";
import type { Platform } from "./platform.ts";

export class OakPlatformAdapter implements Platform {
  #app: Application;

  constructor() {
    this.#app = new Application();
  }

  public registerVersion(options: Required<ApplicationVersionOptions>): void {
    const router = new Router({
      prefix: `/${options.version}`,
      sensitive: true,
    });
    for (const controller of options.controllers) {
      router.get("/messages", (ctx) => {
        ctx.response.body = `<!DOCTYPE html>
      <html>
        <head><title>Hello oak!</title><head>
        <body>
          <h1>Hello oak!</h1>
        </body>
      </html>
    `;
      });
    }

    this.#app.use(router.routes());
    this.#app.use(router.allowedMethods());
  }

  public async listen(
    options: Required<ApplicationListenOptions>,
  ): Promise<void> {
    const onListen = this.#onListen.bind(this);
    this.#app.addEventListener("listen", onListen);
    try {
      await this.#app.listen({
        port: options?.port,
        hostname: options?.hostname,
      });
    } finally {
      this.#app.removeEventListener("listen", { handleEvent: onListen });
    }
  }

  #onListen({ hostname, port, secure }: ApplicationListenEvent): void {
    console.log(
      `Listening on: ${secure ? "https://" : "http://"}${
        hostname ?? "localhost"
      }:${port}`,
    );
  }
}
