// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import * as z from "zod";
import { type ClassType, exists, type Fn } from "./utils.ts";
import {
  ClassRegistrationType,
  getRegistrationKey,
  maybeGetRegistrationKey,
  registerClass,
} from "./registration.ts";

// TODO(jonnydgreen): we most likely want custom types for this
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
  target: Class,
  context: ClassFieldDecoratorContext<Class, Type>,
) => (this: Class, value: Type) => Type {
  function fieldDecorator<Class>(
    this: unknown,
    _target: Class,
    context: ClassFieldDecoratorContext<Class, Type>,
  ): (this: Class, value: Type) => Type {
    const fieldName = context.name.toString();
    return function (this: Class, value: Type): Type {
      const thisArg = this as ClassType | undefined;
      const fieldSlug = `${thisArg?.constructor.name}.${fieldName}`;
      if (context.static) {
        throw new FieldDecoratorError(
          `Field() registration failed for '${thisArg?.name}.${fieldName}': static field registration is unsupported`,
        );
      }
      if (context.private) {
        throw new FieldDecoratorError(
          `Field() registration failed for '${thisArg?.constructor.name}.${fieldName}': private field registration is unsupported`,
        );
      }

      const { key: classKey, schema: validation } = getRootTypeInfo(
        fieldSlug,
        (this as ClassType).constructor as Fn,
      );

      // Handle custom types
      const fieldTypeKey = maybeGetRegistrationKey(options.type);
      if (fieldTypeKey) {
        const customValidation = models.get(fieldTypeKey);
        if (!exists(customValidation)) {
          throw new FieldDecoratorError(
            `Field() registration failed for '${thisArg?.constructor.name}.${fieldName}': no validation schema exists for field type '${fieldTypeKey.description}'`,
          );
        }
        models.set(
          classKey,
          validation.extend({ [fieldName]: customValidation }),
        );
        return value;
      }

      const typeName = options.type.name;
      switch (typeName) {
        case "String": {
          models.set(
            classKey,
            validation.extend({ [fieldName]: z.string() }),
          );
          break;
        }
        case "Number": {
          models.set(
            classKey,
            validation.extend({ [fieldName]: z.number() }),
          );
          break;
        }
        case "Boolean": {
          models.set(
            classKey,
            validation.extend({ [fieldName]: z.boolean() }),
          );
          break;
        }
        default: {
          throw new FieldDecoratorError(
            `Field() registration failed for '${thisArg?.constructor.name}.${fieldName}': unsupported type name '${typeName}'`,
          );
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
 * Get the type information for a registered model.
 *
 * If no schema is defined for the model, then an error will be thrown.
 *
 * @param target The target model to get the type information from.
 * @typeParam Class The class type to get type info for.
 * @returns The type information
 */
function getRootTypeInfo<Class extends ClassType>(
  fieldSlug: string,
  target: Class | Fn,
): TypeInfo<InstanceType<Class>> {
  const key = getRegistrationKey(target);
  const schema = models.get(key);
  if (!exists(schema)) {
    throw new FieldDecoratorError(
      `Field() registration failed for ${fieldSlug}: no schema defined for '${key.description}'`,
    );
  }
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
 * The type information returned by {@linkcode getRootTypeInfo}.
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

// TODO: look into a generic error that forces one to define:
//  - an error code
//  - associated documentation link for that error code

/**
 * A field error that can be thrown when registering a Field for a model.
 *
 * @example Usage
 * ```ts
 * import { FieldDecoratorError } from "@eyrie/app";
 * import { assert } from "@std/assert";
 *
 * const error = new FieldDecoratorError()
 * assert(error instanceof Error);
 * assert(typeof error.message === "string");
 * ```
 */
export class FieldDecoratorError extends Error {
  /**
   * The name of the error.
   * @example Usage
   * ```ts
   * import { FieldDecoratorError } from "@eyrie/app";
   * import { assert } from "@std/assert";
   *
   * const error = new FieldDecoratorError()
   * assert(error.name === "FieldDecoratorError");
   * ```
   */
  override readonly name = "FieldDecoratorError";
}
