# Tools

These docs cover the internal scripts located in `_tools`.

## Check doc imports

Location: `_tools/check_doc_imports.ts`

The purpose of this script is to ensure that all imports can be correctly
resolved including those within doc-strings to ensure that they are correctly
defined.

It can be invoked via the following command:

```sh
deno task lint:doc-imports
```

If all is okay, the command will exit with a status code of `0`.

## Check license

Location: `_tools/check_license.ts`

The purpose of this script is to ensure that all source files include license
information at the top of the file. If a file is missing license headers, it
will automatically add the license headers to each file.

It can be invoked via the following command:

```sh
deno task fmt:license-headers
```

If all is okay, the command will exit with a status code of `0`.
