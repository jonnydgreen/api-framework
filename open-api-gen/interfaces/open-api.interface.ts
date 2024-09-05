// A TypeScript interface for OpenAPI 3.1.0
interface Servers {
  url: string;
  description?: string;
  variables?: {
    [variable: string]: {
      enum?: string[];
      default: string;
      description?: string;
    };
  };
}

interface ReferenceObject {
  $ref: string;
  summary?: string;
  description?: string;
}

interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: {
    description?: string;
    url: string;
  };
  operationId?: string;
  parameters?:
    | Array<ParametersObject>
    | ReferenceObject;
  requestBody?: {
    description?: string;
    content: {
      [mediaType: string]: {
        schema: any; // You can replace 'any' with a more specific type if needed
        example?: any;
        examples?: {
          [exampleName: string]: any; // You can replace 'any' with a more specific type if needed
        };
      };
    };
    required?: boolean;
  };
  responses: {
    [statusCode: string]: {
      description: string;
      headers?: {
        [headerName: string]: {
          description?: string;
          schema: any; // You can replace 'any' with a more specific type if needed
        };
      };
      content?: {
        [mediaType: string]: {
          schema: any; // You can replace 'any' with a more specific type if needed
          example?: any;
          examples?: {
            [exampleName: string]: any; // You can replace 'any' with a more specific type if needed
          };
        };
      };
      links?: {
        [linkName: string]: {
          operationId?: string;
          parameters?: {
            [parameterName: string]: any; // You can replace 'any' with a more specific type if needed
          };
          requestBody?: any; // You can replace 'any' with a more specific type if needed
          description?: string;
        };
      };
    };
  };
  callbacks?: {
    [callbackName: string]: any; // You can replace 'any' with a more specific type if needed
  };
  deprecated?: boolean;
  security?: Array<{
    [securityScheme: string]: string[];
  }>;
  servers?: Array<Servers>;
}

interface ParametersObject {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema?: any; // You can replace 'any' with a more specific type if needed
  example?: any;
  examples?: {
    [exampleName: string]: any; // You can replace 'any' with a more specific type if needed
  };
}

export interface OpenAPI310 {
  openapi: string;
  info: {
    title: string;
    summary?: string;
    description?: string;
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
    version: string;
  };
  jsonSchemaDialect?: string;
  servers?: Array<Servers>;
  paths: {
    [path: string]: {
      "$ref"?: string;
      summary?: string;
      description?: string;
      // TODO(aleccool213): do all method types, not just get
      get: OperationObject;
      servers: Array<Servers>;
      parameters?:
        | Array<ParametersObject>
        | ReferenceObject;
    };
  };
  components?: {
    schemas?: {
      [schemaName: string]: any; // You can replace 'any' with a more specific type if needed
    };
    responses?: {
      [responseName: string]: any; // You can replace 'any' with a more specific type if needed
    };
    parameters?: {
      [parameterName: string]: any; // You can replace 'any' with a more specific type if needed
    };
    examples?: {
      [exampleName: string]: any; // You can replace 'any' with a more specific type if needed
    };
    requestBodies?: {
      [requestBodyName: string]: any; // You can replace 'any' with a more specific type if needed
    };
    headers?: {
      [headerName: string]: any; // You can replace 'any' with a more specific type if needed
    };
    securitySchemes?: {
      [securitySchemeName: string]: any; // You can replace 'any' with a more specific type if needed
    };
    links?: {
      [linkName: string]: any; // You can replace 'any' with a more specific type if needed
    };
    callbacks?: {
      [callbackName: string]: any; // You can replace 'any' with a more specific type if needed
    };
  };
  security?: Array<{
    [securityScheme: string]: string[];
  }>;
  tags?: Array<{
    name: string;
    description?: string;
    externalDocs?: {
      description?: string;
      url: string;
    };
  }>;
  externalDocs?: {
    description?: string;
    url: string;
  };
}
