// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import * as z from "zod";
import type { ClassType, Fn } from "./utils.ts";
import {
  ClassRegistrationType,
  getRegistrationKey,
  maybeGetRegistrationKey,
  registerClass,
} from "./registration.ts";
import { assertExists } from "@std/assert";

export type { ZodObject, ZodRawShape, ZodTypeAny } from "zod";

const models = new Map<symbol, ValidationMetadata>();

type ValidationMetadata = z.ZodObject<z.ZodRawShape>;

/**
 * The input type class method decorator that registers a field for a type.
 *
 * @param options The field type options
 * @typeParam TypeConstructor The constructor type associated with the {@linkcode Field} decorator.
 * @typeParam Type The mapped type associated with the {@linkcode Field} decorator.
 * @returns The {@linkcode Field} decorator function.
 * @example Usage
 * ```ts no-assert
 * import { ObjectType, Field } from "@eyrie/app";
 * @ObjectType({ description: "Message" })
 * class Message {
 *   @Field({ description: "Content of the Message.", type: String })
 *   content!: string;
 * }
 * ```
 */
export function Field<
  TypeConstructor extends ClassType,
  Type extends MapType<TypeConstructor>,
>(
  options: FieldOptions<TypeConstructor>,
): <Class>(
  this: unknown,
  _target: Class,
  context: ClassFieldDecoratorContext<Class, Type>,
) => (this: Class, value: Type) => Type {
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
      const fieldTypeKey = maybeGetRegistrationKey(options.type);
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

/**
 * The field options for {@linkcode Field}.
 */
export interface FieldOptions<Type> {
  /**
   * The description of the field type.
   */
  description: string;
  /**
   * The type of the field type.
   */
  type: Type;
}

/**
 * Get the type information for a registered model.
 *
 * If no schema is defined for the model, then an error will be thrown.
 *
 * @param target The target model to get the type information from.
 * @typeParam Class The class type to get type info for.
 * @returns The type information
 */
function getTypeInfo<Class extends ClassType>(
  target: Class | Fn,
): TypeInfo<InstanceType<Class>> {
  const key = getRegistrationKey(target);
  const schema = models.get(key);
  assertExists(
    schema,
    `No schema defined for ${target} with key: ${key.description}`,
  );
  return { key, schema: schema as TypeInfo<InstanceType<Class>>["schema"] };
}

/**
 * The type info schema used in {@linkcode TypeInfo}.
 */
export type TypeInfoSchema<Type extends z.ZodRawShape> = z.ZodObject<
  Type,
  "strip",
  z.ZodTypeAny,
  Type,
  Type
>;

/**
 * The type information returned by {@linkcode getTypeInfo}.
 */
export interface TypeInfo<Type extends z.ZodRawShape> {
  /**
   * The registration key of the type information.
   */
  key: symbol;
  /**
   * The schema of the of the type information.
   */
  schema: TypeInfoSchema<Type>;
}

/**
 * The object type class decorator that registers a class as an object type.
 *
 * @param _options The object type options
 * @returns The {@linkcode ObjectType} decorator function.
 * @example Usage
 * ```ts no-assert
 * import { ObjectType, Field } from "@eyrie/app";
 * @ObjectType({ description: "Message" })
 * class Message {
 *   @Field({ description: "Content of the Message.", type: String })
 *   content!: string;
 * }
 * ```
 */
export function ObjectType(_options: ObjectTypeOptions): (
  target: ClassType,
  _context: ClassDecoratorContext,
) => void {
  function objectTypeDecorator<Class extends ClassType>(
    target: Class,
    _context: ClassDecoratorContext<Class>,
  ): void {
    const key = registerClass({
      type: ClassRegistrationType.ObjectType,
      target,
    });
    models.set(key, z.object({}));
    // TODO(jonnydgreen): is there a better way of triggering the field exports?
    new target();
  }
  return objectTypeDecorator;
}

/**
 * The object type options for {@linkcode ObjectType}.
 */
export interface ObjectTypeOptions {
  /**
   * The description of the object type.
   */
  description: string;
}

/**
 * The input type class decorator that registers a class as an input type.
 *
 * @param _options The input type options
 * @returns The {@linkcode InputType} decorator function.
 * @example Usage
 * ```ts no-assert
 * import { InputType, Field } from "@eyrie/app";
 * @InputType({ description: "Message" })
 * class MessageInput {
 *   @Field({ description: "Content of the Message.", type: String })
 *   content!: string;
 * }
 * ```
 */
export function InputType(_options: InputTypeOptions): (
  target: ClassType,
  _context: ClassDecoratorContext,
) => void {
  function inputTypeDecorator<Class extends ClassType>(
    target: Class,
    _context: ClassDecoratorContext<Class>,
  ): void {
    const key = registerClass({
      type: ClassRegistrationType.InputType,
      target,
    });
    // TODO(jonnydgreen): insert options here
    models.set(key, z.object({}));
    // TODO(jonnydgreen): is there a better way of triggering the field exports?
    new target();
  }
  return inputTypeDecorator;
}

/**
 * The input type options for {@linkcode InputType}.
 */
export interface InputTypeOptions {
  /**
   * The description of the input type.
   *
   * @example
   * ```ts
   * import { InputType } from "@eyrie/app"
   * @InputType({ description: "Input" })
   * class Input {}
   * ```
   */
  description: string;
}

/**
 * A type mapper that is used to convert types defined in decorators to those
 * defined on the decorated definitions.
 */
export type MapType<T> = T extends StringConstructor ? string
  : T extends NumberConstructor ? number
  : T extends BooleanConstructor ? boolean
  : T extends undefined ? undefined
  : T extends null ? null
  : T extends ClassType ? InstanceType<T>
  : T;
