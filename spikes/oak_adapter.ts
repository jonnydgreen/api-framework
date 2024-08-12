// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// TODO(jonnydgreen): doc-strings with full examples

// import { Application, ApplicationListenEvent } from "@oak/oak/application";
// import { Router, RouterMiddleware } from "@oak/oak/router";
// import type {
//   ApplicationListenOptions,
//   ApplicationVersionOptions,
// } from "../application.ts";
// import type { Driver } from "./driver.ts";
// import { getControllerRoutes } from "../router.ts";
// import { assertNever } from "../utils.ts";

// export class OakDriverAdapter implements Driver {
//   #app: Application;

//   constructor() {
//     this.#app = new Application();
//   }

//   public registerVersion(options: Required<ApplicationVersionOptions>): void {
//     const router = new Router({
//       prefix: `/${options.version}`,
//       sensitive: true,
//     });
//     for (const controller of options.controllers) {
//       const routes = getControllerRoutes(controller);
//       for (const route of routes) {
//         let registerRouteFn: <R extends string>(
//           path: string,
//           middleware: RouterMiddleware<R>,
//         ) => void;
//         switch (route.method) {
//           case "GET": {
//             registerRouteFn = router.get.bind(router);
//             break;
//           }
//           default: {
//             assertNever(route.method, `Method ${route.method} not supported`);
//           }
//         }
//         registerRouteFn(route.path, route.handler);
//       }
//     }
//     this.#app.use(router.routes());
//     this.#app.use(router.allowedMethods());
//   }

//   public async listen(
//     options: Required<ApplicationListenOptions>,
//   ): Promise<void> {
//     const onListen = this.#onListen.bind(this);
//     this.#app.addEventListener("listen", onListen);
//     try {
//       await this.#app.listen({
//         port: options?.port,
//         hostname: options?.hostname,
//       });
//     } finally {
//       this.#app.removeEventListener("listen", { handleEvent: onListen });
//     }
//   }

//   #onListen({ hostname, port, secure }: ApplicationListenEvent): void {
//     console.log(
//       `Listening on: ${secure ? "https://" : "http://"}${
//         hostname ?? "localhost"
//       }:${port}`,
//     );
//   }
// }
