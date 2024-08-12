// Copyright 2024-2024 the API framework authors. All rights reserved. MIT license.

import { blue, red, yellow } from "@std/fmt/colors";
import { walk } from "@std/fs/walk";
import ts, {
  type ImportDeclaration,
  type StringLiteral,
} from "@npm/typescript";
const {
  createSourceFile,
  ScriptTarget,
  SyntaxKind,
} = ts;

const EXTENSIONS = [".mjs", ".js", ".ts", ".md"];
const EXCLUDED_PATHS = [
  ".git",
  ".github",
  "_tools",
  "node_modules",
  "npm",
  "scripts",
  "sandbox",
];
const ALLOWED_EXTERNAL_DEPS = [
  "https://deno.land/x/postgres@v0.17.0/",
  "npm:@nestjs/common@^10.2.7",
];

const ROOT = new URL("../", import.meta.url);
const ROOT_LENGTH = ROOT.pathname.slice(0, -1).length;

const RX_JSDOC_COMMENT = /\*\*[^*]*\*+(?:[^/*][^*]*\*+)*/gm;
const RX_JSDOC_REMOVE_LEADING_ASTERISK = /^\s*\* ?/gm;
const RX_CODE_BLOCK = /`{3}([\w]*)\n([\S\s]+?)\n`{3}/gm;

let shouldFail = false;
let countChecked = 0;

function checkImportStatements(
  codeBlock: string,
  filePath: string,
  lineNumber: number,
): void {
  const sourceFile = createSourceFile(
    "doc-imports-checker$",
    codeBlock,
    ScriptTarget.Latest,
  );
  const importDeclarations = sourceFile.statements.filter((s) =>
    s.kind === SyntaxKind.ImportDeclaration
  ) as ImportDeclaration[];

  for (const importDeclaration of importDeclarations) {
    const { moduleSpecifier } = importDeclaration;
    const importPath = (moduleSpecifier as StringLiteral).text;
    const isRelative = importPath.startsWith(".");
    // TODO: uncomment when the start path is known
    // const isInternal = importPath.startsWith(
    //   "",
    // );
    const isInternal = false;
    const isAllowedExternalDep = ALLOWED_EXTERNAL_DEPS.some((dep) =>
      importPath.startsWith(dep)
    );
    const isStdLib = importPath.startsWith("https://deno.land/std/");
    const { line } = sourceFile.getLineAndCharacterOfPosition(
      moduleSpecifier.pos,
    );

    if (isRelative || !(isInternal || isStdLib || isAllowedExternalDep)) {
      console.log(
        yellow("Warn ") +
          (isRelative
            ? "relative import path"
            : "external or incorrectly versioned dependency") +
          ": " +
          red(`"${importPath}"`) + " at " +
          blue(
            filePath.substring(ROOT_LENGTH + 1),
          ) + yellow(":" + (lineNumber + line)),
      );

      shouldFail = true;
    }
  }
}

function checkCodeBlocks(
  content: string,
  filePath: string,
  lineNumber = 1,
): void {
  for (const codeBlockMatch of content.matchAll(RX_CODE_BLOCK)) {
    const [, language, codeBlock] = codeBlockMatch;
    const codeBlockLineNumber =
      content.slice(0, codeBlockMatch.index).split("\n").length;

    if (
      language && codeBlock &&
      ["ts", "js", "typescript", "javascript", ""].includes(
        language.toLocaleLowerCase(),
      )
    ) {
      checkImportStatements(
        codeBlock,
        filePath,
        lineNumber + codeBlockLineNumber,
      );
    }
  }
}

for await (
  const { path } of walk(ROOT, {
    exts: EXTENSIONS,
    includeDirs: false,
    skip: EXCLUDED_PATHS.map((p) => new RegExp(p + "$")),
  })
) {
  const content = await Deno.readTextFile(path);
  countChecked++;

  if (path.endsWith(".md")) {
    checkCodeBlocks(content, path);
  } else {
    for (const jsdocMatch of content.matchAll(RX_JSDOC_COMMENT)) {
      const comment = jsdocMatch[0].replaceAll(
        RX_JSDOC_REMOVE_LEADING_ASTERISK,
        "",
      );
      const commentLineNumber =
        content.slice(0, jsdocMatch.index).split("\n").length;

      checkCodeBlocks(comment, path, commentLineNumber);
    }
  }
}

console.log(`Checked ${countChecked} files`);
if (shouldFail) Deno.exit(1);
