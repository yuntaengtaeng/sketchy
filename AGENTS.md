# Sketchy development rules

Use `docs/README.md` to find product documents by role. This file is the single source of truth for agent instructions; `CLAUDE.md` imports it for Claude.

For every coding task, read and apply `.agents/skills/sketchy-code-style/SKILL.md` first. It is the highest-priority code guidance in this repository. Then apply `.agents/skills/ponytail/SKILL.md` at full intensity; when they conflict, `sketchy-code-style` wins.

Also apply every specialist skill whose runtime is affected:

- `.agents/skills/sketchy-figma-react/SKILL.md` for `src/ui`, `src/plugin`, or the Main ↔ UI contract.
- Keep shared domain rules in `core`/`shared`, not in runtime adapters.

- Understand the affected flow before editing; fix root causes in the shared path.
- Reuse existing code, then standard APIs, then installed dependencies.
- Prefer the smallest working change and the fewest files that still keep responsibilities clear.
- Do not add speculative abstractions, configuration, dependencies, or features.
- Prefer click-first workflows and useful defaults; require typing or configuration only when essential.
- Before changing interaction UI, follow `Interaction UI 원칙` in `docs/product/feature-model.md`; name controls by outcomes and use a segmented selector, Radio, Select, Checkbox, or Switch according to the shape of the choice.
- When asked to create personas or run persona-based UX validation, follow `docs/research/persona-validation.md`. Keep each evaluator independent from existing `persona/` results until its report is complete.
- When asked to create a functional specification, follow `docs/workflows/functional-spec.md`. Inspect the current UI with Playwright and write `functional-spec/YYYY-MM-DD-spec.md` with its screenshots under `functional-spec/assets/YYYY-MM-DD/`.
- Do not trade away validation, data safety, accessibility, or required error handling.
- When unrelated responsibilities accumulate in one file, perform the smallest useful split before adding more branches.
- Add one focused check for non-trivial logic and run `npm run check` plus `npm run build` before handoff.
- Run `npm run format` after source changes.
