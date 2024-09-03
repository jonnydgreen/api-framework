// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { Application } from "@eyrie/app";
import { MessageController } from "./basic_controller.ts";

const app = new Application();

app.registerVersion({
  version: "v1",
  controllers: [MessageController],
});

await app.listen();
