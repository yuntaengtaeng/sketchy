# Sketchy development rules

Use the project-local `.agents/skills/ponytail/SKILL.md` skill at full intensity for every coding task in this repository.

- Understand the affected flow before editing; fix root causes in the shared path.
- Reuse existing code, then standard APIs, then installed dependencies.
- Prefer the smallest working change and the fewest files that still keep responsibilities clear.
- Do not add speculative abstractions, configuration, dependencies, or features.
- Do not trade away validation, data safety, accessibility, or required error handling.
- When unrelated responsibilities accumulate in one file, perform the smallest useful split before adding more branches.
- Add one focused check for non-trivial logic and run `npm run check` plus `npm run build` before handoff.
- Run `npm run format` after source changes.
