# Code Conventions

Key principles and conventions to follow when writing code:

## General conventions

- Prefer Deno over other tooling
  - Additional tooling should be carefully considered as to whether it is truly
    required
- Keep things lightweight

## File/folder conventions

- Filenames should be in lower snake case (e.g. `file_name.ts`)
- Folder/file structure should be as flat as possible
- Don't use `index.ts` files unless necessary
- All ts/js files should have a license header

## TODOs

> You don’t make anything perfect, you simply run out of time

Sometimes, we don't have time or capacity to fix an issue. The final 10% of a
solution is almost always the hardest thing to complete. Here we like to take a
pragmatic approach by marking code to be improved later, with the following
proviso that the code to be fixed is not going to cause a major issue.

We use the following convention to highlight areas of code with a TODO:

- Use `TODO: description` as the name and description
- If the `TODO` has an owner, indicate as follows: `TODO(jonnydgreen):`
- If the `TODO` has a related ticket, indicate as follows:
  `TODO: GH-1234 description: https://jonnydgreen/api-framework/issues/1234`
