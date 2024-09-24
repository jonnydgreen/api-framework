# Contributing

## Pre-requisites

This repo using git hooks to ensure that the code is committed in a good state.
To install the hooks, run the following command:

```bash
git config core.hooksPath .githooks
```

Ensure the following are installed:

- [Deno](https://docs.deno.com/runtime/manual/getting_started/installation)

## Run checks

To run checks such as type checking, linting etc, run the following in your
terminal session:

```shell
deno task ok
```

## Run test

To run the tests including tests for the docs, run the following in your
terminal session:

```shell
deno task test
```

## Run tests in watch mode

Sometimes, you may want to run tests in watch mode to restart the tests upon
file changes. In this case, run the following in your terminal session:

```shell
deno task test:watch
```

## Generate and view coverage report

To generate and view a coverage report, run the following in your terminal
session:

```shell
deno task report
```
