// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { assert } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { beforeAll, describe, it } from "@std/testing/bdd";

const stringTestCases: TestCase[] = [
  {
    decoratorType: { imports: [], type: "String" },
    fieldType: { imports: [], type: "number" },
  },
  {
    decoratorType: { imports: [], type: "String" },
    fieldType: { imports: [], type: "boolean" },
  },
  {
    decoratorType: { imports: [], type: "String" },
    fieldType: { imports: [], type: "symbol" },
  },
  {
    decoratorType: { imports: [], type: "String" },
    fieldType: { imports: [], type: "unknown" },
  },
  {
    decoratorType: { imports: [], type: "String" },
    fieldType: { imports: [], type: "undefined" },
  },
  {
    decoratorType: { imports: [], type: "String" },
    fieldType: { imports: [], type: "null" },
  },
];

const numberTestCases: TestCase[] = [
  {
    decoratorType: { imports: [], type: "Number" },
    fieldType: { imports: [], type: "string" },
  },
  {
    decoratorType: { imports: [], type: "Number" },
    fieldType: { imports: [], type: "boolean" },
  },
  {
    decoratorType: { imports: [], type: "Number" },
    fieldType: { imports: [], type: "symbol" },
  },
  {
    decoratorType: { imports: [], type: "Number" },
    fieldType: { imports: [], type: "unknown" },
  },
  {
    decoratorType: { imports: [], type: "Number" },
    fieldType: { imports: [], type: "undefined" },
  },
  {
    decoratorType: { imports: [], type: "Number" },
    fieldType: { imports: [], type: "null" },
  },
];

const booleanTestCases: TestCase[] = [
  {
    decoratorType: { imports: [], type: "Boolean" },
    fieldType: { imports: [], type: "string" },
  },
  {
    decoratorType: { imports: [], type: "Boolean" },
    fieldType: { imports: [], type: "number" },
  },
  {
    decoratorType: { imports: [], type: "Boolean" },
    fieldType: { imports: [], type: "symbol" },
  },
  {
    decoratorType: { imports: [], type: "Boolean" },
    fieldType: { imports: [], type: "unknown" },
  },
  {
    decoratorType: { imports: [], type: "Boolean" },
    fieldType: { imports: [], type: "undefined" },
  },
  {
    decoratorType: { imports: [], type: "Boolean" },
    fieldType: { imports: [], type: "null" },
  },
];

describe("Model types", {
  permissions: {
    read: true,
    run: true,
    write: true,
  },
}, () => {
  describe("String", () => handleTestCases(stringTestCases));
  describe("Number", () => handleTestCases(numberTestCases));
  describe("Boolean", () => handleTestCases(booleanTestCases));
});

function handleTestCases(
  testCases: TestCase[],
): void {
  const snippetResultsMap = new Map<string, Required<TestCase>>();

  beforeAll(async () => {
    await Promise.all(
      testCases.map(async ({ decoratorType, fieldType }) => {
        const snippet = `
                  import { Field, ObjectType } from "@eyrie/app";
                  @ObjectType({ description: "Model" })
                  class Model {
                    @Field({ description: "Field", type: ${decoratorType.type} })
                    field!: ${fieldType.type}
                  }`;
        snippetResultsMap.set(`${decoratorType.type}-${fieldType.type}`, {
          decoratorType,
          fieldType,
          results: await evaluateSnippet(snippet),
        });
      }),
    );
  });

  testCases.forEach(({ decoratorType, fieldType }) => {
    it(`should error model field decorator of type '${decoratorType.type}' does not map to field type of type '${fieldType.type}'`, async (t) => {
      // Act
      const key = `${decoratorType.type}-${fieldType.type}`;
      const snippetResults = snippetResultsMap.get(key);
      assert(snippetResults, `No results found key snippet key: ${key}`);
      const diagnostics = sanitiseDiagnostics(
        snippetResults.results.diagnostics,
      );

      // Assert
      assert(
        !snippetResults.results.success,
        `Snippet did not fail to compile: ${snippetResults.results.snippet}`,
      );
      await assertSnapshot(t, diagnostics);
    });
  });
}

interface SnippetResult {
  snippet: string;
  success: boolean;
  diagnostics: string;
}

interface TestCase {
  decoratorType: { imports: string[]; type: string };
  fieldType: { imports: string[]; type: string };
  results?: SnippetResult;
}

function sanitiseDiagnostics(diagnostics: string): string {
  return diagnostics.replace(
    /file:\/\/.+\/\$deno\$eval\.ts/g,
    "file://__PATH__/$deno$eval.ts",
  );
}

async function evaluateSnippet(
  snippet: string,
): Promise<SnippetResult> {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "eval",
      "--ext=ts",
      "--check",
      "--unstable-webgpu",
      "--no-lock",
      snippet,
    ],
    env: {
      NO_COLOR: "true",
    },
    stderr: "piped",
  });
  const { success, stderr } = await command.output();
  const diagnostics = new TextDecoder().decode(stderr);
  return { snippet: snippet, success, diagnostics };
}
