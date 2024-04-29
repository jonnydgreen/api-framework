// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// deno-fmt-ignore-file

import { decorate, inject, injectable, interfaces, Container } from "npm:inversify";
import getDecorators from "npm:inversify-inject-decorators";

export type Kernel = Container;

// deno-lint-ignore no-explicit-any
export type ClassType<T = unknown> = new (...args: any[]) => T;

interface IMetadata {
  injectable: Record<string, boolean>
  inject: Record<string, unknown>
}

const metadata: IMetadata = {
  injectable: {},
  inject: {}
}

function makeInjectable (target: ClassType): void {
  decorate(injectable(), target)
}

export function register<T>(
  container: Kernel,
  type: symbol,
  target: ClassType<T>,
  ...types: symbol[]
): interfaces.BindingInWhenOnSyntax<T> {
  if (!metadata.injectable[target.name]) {
    makeInjectable(target)
    metadata.injectable[target.name] = true
  }
  let index = 0;
  for (const type of types) {
    const injectKey = `${target.name}.${index}`
    if (typeof metadata.inject[injectKey] === 'undefined') {
      decorate(inject(type) as ParameterDecorator, target, index++)
      metadata.inject[injectKey] = true
    }
  }
  return container.bind<T>(type).to(target);
}

export function registerLazy<T>(
  container: Kernel,
  type: symbol,
  target: ClassType<T>,
  ...types: symbol[]
): interfaces.BindingInWhenOnSyntax<T> {
  const { lazyInject } = getDecorators.default(container);
  if (!metadata.injectable[target.name]) {
    makeInjectable(target)
    metadata.injectable[target.name] = true
  }
  let index = 0;
  for (const type of types) {
    const injectKey = `${target.name}.${index}`
    if (typeof metadata.inject[injectKey] === 'undefined') {
      decorate(lazyInject(type) as ParameterDecorator, target, index++)
      metadata.inject[injectKey] = true
    }
  }
  return container.bind<T>(type).to(target);
}
