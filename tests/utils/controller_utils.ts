// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import {
  type ClassType,
  type Context,
  Controller,
  Get,
  type GetOptions,
  type Injectable,
  type InjectableRegistration,
  Post,
  type PostOptions,
  type RoutePath,
} from "@eyrie/app";

interface ControllerHandlerInput {
  ctx: Context | undefined;
  params: unknown | undefined;
  body?: unknown;
}

interface ControllerResult {
  controller: ClassType<Injectable>;
  input: ControllerHandlerInput;
}

export function createControllerWithPostRoute(
  controllerPath: RoutePath,
  options: PostOptions<ClassType<unknown>, unknown>,
  handler?: (ctx: Context, params: unknown, body: unknown) => void,
): ControllerResult {
  const input: ControllerHandlerInput = {
    ctx: undefined,
    params: undefined,
  };
  @Controller(controllerPath)
  class BaseController implements Injectable {
    public register(): InjectableRegistration {
      return { dependencies: [] };
    }

    @Post(options)
    public postRoute(ctx: Context, params: unknown, body: unknown): unknown {
      input.ctx = ctx;
      input.params = params;
      input.body = body;
      if (handler) {
        return handler(input.ctx, input.params, input.body);
      }
    }
  }
  return { controller: BaseController, input };
}

export function createControllerWithGetRoute(
  controllerPath: RoutePath,
  options: GetOptions<unknown>,
  handler?: (ctx: Context, params: unknown) => void,
): ControllerResult {
  const input: ControllerHandlerInput = {
    ctx: undefined,
    params: undefined,
  };
  @Controller(controllerPath)
  class BaseController implements Injectable {
    public register(): InjectableRegistration {
      return { dependencies: [] };
    }

    @Get(options)
    public getRoute(
      ctx: Context,
      params: unknown,
    ): unknown {
      input.ctx = ctx;
      input.params = params;
      if (handler) {
        return handler(ctx, params);
      }
    }
  }
  return { controller: BaseController, input };
}
