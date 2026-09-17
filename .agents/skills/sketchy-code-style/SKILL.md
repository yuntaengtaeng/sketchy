---
name: sketchy-code-style
description: Apply Sketchy's repository-wide TypeScript, domain-boundary, error-handling, and test principles for every coding or code-review task in this repository.
---

# Sketchy Code Style

Apply this skill before every coding task. Use `docs/README.md` to find the relevant product document and trace the affected data flow before editing.

## Rules

- Keep Project types, validation, and domain behavior in pure TypeScript under `src/core` or `src/shared`.
- Keep browser and Figma APIs out of `core` and `shared`.
- Do not add `any`, unsupported assertions, speculative abstractions, configuration, or dependencies.
- Reuse existing domain helpers and platform APIs before adding code.
- Preserve validation, user data, accessibility, and required error handling.
- Use discriminated unions for finite variants and impossible-state prevention.
- Add one focused test for non-trivial branches, parsers, validation, or data transformations.
- Keep edits scoped to the requested flow.

## Completion

After source changes run the focused test, `npm run format`, `npm run check`, `npm run build`, `git diff --check`, and `git status --short`.
