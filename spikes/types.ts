// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const container = new Map();
const typeKey = Symbol("api.type.key");

interface FieldOptions<Type> {
  type: Type;
}

type MapType<T> = T extends StringConstructor ? string
  : T extends NumberConstructor ? number
  : T extends BooleanConstructor ? boolean
  : T extends undefined ? undefined
  : T extends null ? null
  : T extends new (...args: any) => any ? InstanceType<T>
  : T;

export function Field<Constructor, Type extends MapType<Constructor>>(
  options: FieldOptions<Constructor>,
) {
  return function field<Class>(
    this: any,
    _target: any,
    context: ClassFieldDecoratorContext<Class, Type>,
  ): (this: any, value: Type) => Type {
    const fieldName = context.name.toString();
    return function (this: any, value: Type): Type {
      if (context.static || context.private) {
        return value;
      }
      console.log(`Registering field: ${this.constructor.name}.${fieldName}`);
      const key = this.constructor[typeKey];
      if (!key) {
        throw new Error(
          `Type '${this.constructor.name}' has not been registered with '@ObjectType'. Please register with this class decorator.`,
        );
      }
      const validation: z.ZodObject<Record<string | number | symbol, never>> =
        container.get(key);

      // Handle custom types
      const fieldTypeKey: symbol | undefined = (options.type as any)[typeKey];
      if (fieldTypeKey) {
        const customValidation = container.get(fieldTypeKey);
        container.set(
          key,
          validation.extend({ [fieldName]: customValidation }),
        );
        return value;
      }

      const typeName = (options.type as any).name;
      switch (typeName) {
        case "String": {
          container.set(key, validation.extend({ [fieldName]: z.string() }));
          break;
        }
        case "Number": {
          container.set(key, validation.extend({ [fieldName]: z.number() }));
          break;
        }
        case "Boolean": {
          container.set(key, validation.extend({ [fieldName]: z.boolean() }));
          break;
        }
        default: {
          throw new Error(`Unsupported type name: ${typeName}`);
        }
      }
      return value;
    };
  };
}

export function ObjectType() {
  return function objectType<Class extends new (...args: any) => any>(
    target: Class,
    _context: ClassDecoratorContext<Class>,
  ) {
    registerClass(target);
  };
}

function registerClass<Class extends new (...args: any) => any>(target: Class) {
  const key = Symbol(target.name);
  console.log(
    `Registering object type '${target.name}' with key '${String(key)}'`,
  );
  (target as any)[typeKey] = key;
  container.set(key, z.object({}));
  // TODO: worth a discussion to determine when this should be run
  new target();
}

export interface TypeInfo<Type extends z.ZodRawShape> {
  key: symbol;
  schema: z.ZodObject<Type, "strip", z.ZodTypeAny, Type, Type>;
}

export function getTypeInfo<Class extends new (...args: any) => any>(
  target: Class,
): TypeInfo<InstanceType<Class>> {
  const key = (target as any)[typeKey];
  if (!key) {
    throw new Error(
      `Type '${target.name}' has not been registered with '@ObjectType'. Please register with this class decorator.`,
    );
  }
  const schema = container.get(key);
  if (!schema) {
    throw new Error(
      `Type '${target.name}' has not been registered with '@ObjectType'. Please register with this class decorator.`,
    );
  }
  return { key, schema };
}
