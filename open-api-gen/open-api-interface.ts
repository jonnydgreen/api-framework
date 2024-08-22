// A TypeScript interface for OpenAPI 3.1.0
interface OpenApi3Interface {
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
  servers?: Array<{
    url: string;
    description?: string;
    variables?: {
      [variable: string]: {
        enum?: string[];
        default: string;
        description?: string;
      };
    };
  }>;
  // todo
  paths: {
    [path: string]: {
      [method: string]: {
        tags?: string[];
        summary?: string;
        description?: string;
        operationId?: string;
        parameters?: Array<{
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
        }>;
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
        deprecated?: boolean;
        security?: Array<{
          [securityScheme: string]: string[];
        }>;
        servers?: Array<{
          url: string;
          description?: string;
          variables?: {
            [variable: string]: {
              enum?: string[];
              default: string;
              description?: string;
            };
          };
        }>;
      };
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
