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
- Every named function gets a one-line comment right above it stating what it does, even without `@param`/`@returns` tags. Skip this only for trivial one-line arrow functions passed inline (e.g. `.map((x) => x.id)`).
- Avoid stacked/nested ternaries and object-literal-as-switch patterns (`{ CODE_A: "...", CODE_B: "..." }[code]`); use an explicit `switch` with a `default` branch, or a small named helper function instead.
- When a function would take more than two or three parameters, or any optional ones, take a single options object instead of a long positional parameter list.

## Decision priority

Judge code in this order: is the intent obvious, is responsibility singular, is the important behavior easy to test, is core logic free of unneeded coupling to React/browser/network, is the abstraction no more than what's needed. Readable, single-responsibility code comes first; testability and dependency isolation are diagnostic signals for design quality, not goals to chase for their own sake.

Signs the production code needs restructuring, not more test setup: a test needs many mocks, setup outweighs the assertion, one behavior needs many objects, network/storage/timer/DOM all show up together, you want to test a private implementation detail, or one small change breaks unrelated tests. Treat these as evidence the code has too many responsibilities or mixes pure logic with side effects.

- Prefer pure functions for calculation and decisions, push side effects (network, storage, timers, DOM, navigation) to the boundary that calls them
- Test observable behavior and output, not internal call counts or private details
- In React, move business rules and decisions into plain functions the component just calls; keep the component responsible for rendering only
- Do not add abstraction (interfaces, factories, wrappers) purely to make something testable when a plain function already reads clearly; that trade only pays off when responsibilities genuinely need separating, an external system boundary exists, or an implementation must be swappable

## Comment and JSDoc style

- Language: Korean.
- End every comment/JSDoc line as a noun phrase (nominalization), never a conjugated verb ending like `-한다`/`-합니다`.
- Forbidden characters: a trailing period, middle dot (·), em dash (—), any unicode arrow (→ etc.), circled numerals (①②③), and emoji. If an arrow is genuinely needed, use ASCII `->` only.
- For lists, use commas or `1) 2)` style, not bullets with special characters.
- These rules also apply to any user-facing UI string.
- Existing code may still have `~합니다` phrasing or emoji left over from before this rule; do not copy that style into new code.
- One line only, no multi-line prose blocks walking through reasoning or implementation detail. A comment nobody updates when the logic changes rots into a lie; the more it explains, the more likely it drifts. If the WHY genuinely needs more than one line, that is a signal to simplify or rename the code instead of writing more comment.
- Good: `/** 트리거 요소에 Case 하나를 저장하고 Figma Reaction까지 맞춘 결과 Project */`
- Bad: `/** 트리거 요소에 Case를 저장한다. (UI → Plugin · 저장 후 동기화) */` (trailing period, `-한다` verb ending, arrow and middle dot)
- Also bad: a 3-line comment explaining step by step why a field is derived a certain way; compress to the one non-obvious fact, or drop it if the code already says it

## Completion

After source changes run the focused test, `npm run format`, `npm run check`, `npm run build`, `git diff --check`, and `git status --short`.
