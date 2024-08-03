// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import * as z from "@x/zod";
import { ClassType, Fn } from "./utils.ts";
import {
  ClassRegistrationType,
  getClassKey,
  maybeGetClassKey,
  registerClass,
} from "./registration.ts";
import { assertExists } from "@std/assert";

// TODO: doc string

export type ValidationMetadata = z.ZodObject<z.ZodRawShape>;
const models = new Map<symbol, ValidationMetadata>();

export function Field<
  Constructor extends ClassType,
  Type extends MapType<Constructor>,
>(
  options: FieldOptions<Constructor>,
) {
  function fieldDecorator<Class>(
    this: unknown,
    _target: Class,
    context: ClassFieldDecoratorContext<Class, Type>,
  ): (this: Class, value: Type) => Type {
    const propertyName = context.name.toString();
    return function (this: Class, value: Type): Type {
      if (context.static || context.private) {
        return value;
      }

      const { key: classKey, schema: validation } = getTypeInfo(
        (this as ClassType).constructor as Fn,
      );

      // Handle custom types
      const fieldTypeKey = maybeGetClassKey(options.type);
      if (fieldTypeKey) {
        const customValidation = models.get(fieldTypeKey);
        assertExists(
          customValidation,
          `No validation schema exists for field type: ${fieldTypeKey.description}`,
        );
        models.set(
          classKey,
          validation.extend({ [propertyName]: customValidation }),
        );
        return value;
      }

      const typeName = options.type.name;
      switch (typeName) {
        case "String": {
          models.set(
            classKey,
            validation.extend({ [propertyName]: z.string() }),
          );
          break;
        }
        case "Number": {
          models.set(
            classKey,
            validation.extend({ [propertyName]: z.number() }),
          );
          break;
        }
        case "Boolean": {
          models.set(
            classKey,
            validation.extend({ [propertyName]: z.boolean() }),
          );
          break;
        }
        default: {
          throw new Error(`Unsupported type name: ${typeName}`);
        }
      }
      return value;
    };
  }
  return fieldDecorator;
}

export interface TypeInfo<Type extends z.ZodRawShape> {
  key: symbol;
  schema: z.ZodObject<Type, "strip", z.ZodTypeAny, Type, Type>;
}
export function getTypeInfo<Class extends ClassType>(
  target: Class | Fn,
): TypeInfo<InstanceType<Class>> {
  const key = getClassKey(target);
  const schema = models.get(key);
  assertExists(
    schema,
    `No schema defined for ${target} with key: ${key.description}`,
  );
  return { key, schema: schema as TypeInfo<InstanceType<Class>>["schema"] };
}

export interface FieldOptions<Type> {
  description: string;
  type: Type;
}

export function ObjectType(): (
  target: ClassType,
  _context: ClassDecoratorContext,
) => void {
  function objectTypeDecorator<Class extends ClassType>(
    target: Class,
    _context: ClassDecoratorContext<Class>,
  ): void {
    const key = registerClass(ClassRegistrationType.ObjectType, target);
    models.set(key, z.object({}));
    // TODO: is there a better way of triggering the field exports?
    new target();
  }
  return objectTypeDecorator;
}

/**
 * The input type options
 */
export interface InputTypeOptions {
  /**
   * The description of the input type
   *
   * @example
   * ```ts
   * @InputType({ description: "Input" })
   * class Input {}
   * ```
   */
  description: string;
}

export function InputType(_options: InputTypeOptions): (
  target: ClassType,
  _context: ClassDecoratorContext,
) => void {
  function inputTypeDecorator<Class extends ClassType>(
    target: Class,
    _context: ClassDecoratorContext<Class>,
  ): void {
    const key = registerClass(ClassRegistrationType.InputType, target);
    // TODO: insert options here
    models.set(key, z.object({}));
    // TODO: is there a better way of triggering the field exports?
    new target();
  }
  return inputTypeDecorator;
}

type MapType<T> = T extends StringConstructor ? string
  : T extends NumberConstructor ? number
  : T extends BooleanConstructor ? boolean
  : T extends undefined ? undefined
  : T extends null ? null
  : T extends ClassType ? InstanceType<T>
  : T;
