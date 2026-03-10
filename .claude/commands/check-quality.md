Run the full quality gate for this Next.js TypeScript project.

## Argument: $ARGUMENTS

- If the argument is `fix`: run `next lint --fix` first to auto-correct fixable lint issues, then proceed with the full gate.
- If no argument is provided: skip the auto-fix step and go straight to the full gate.

## Steps

Run the following commands **in order**. Do not proceed to the next step if the current one fails — fix all errors first, then re-run that step until it passes.

1. *(only if argument is `fix`)* `npx next lint --fix` — auto-fix lint issues
2. `npm run lint` — report any remaining lint errors and fix them
3. `npx tsc --noEmit` — report and fix type errors
4. `npm run build` — report and fix compile or missing import errors

## After each failure

- Identify the root cause of each error.
- Fix it in the source file — do not suppress errors with `// eslint-disable`, `as any`, or `// @ts-ignore` unless there is no correct alternative, and always leave a comment explaining why.
- Re-run the failed step to confirm it passes before moving on.

## Done

All three checks (lint, tsc, build) must exit with zero errors. Report a short summary of what passed, what was fixed, and any issues that require manual attention.
