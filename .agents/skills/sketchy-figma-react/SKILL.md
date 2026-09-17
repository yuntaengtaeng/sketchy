---
name: sketchy-figma-react
description: Apply Sketchy-specific React UI, Figma Plugin runtime, typed message-boundary, state, effect, and async-lifecycle rules when changing or reviewing src/ui, src/plugin, or their shared protocol.
---

# Sketchy Figma + React

Apply `sketchy-code-style` first.

## Runtime boundary

- Plugin Main owns `figma.*`, Canvas lookup and mutation, plugin data, and prototype/Flow projection.
- React UI owns user input, view state, and feedback.
- Communicate through the typed, serializable `PluginMessage` and `UiMessage` protocol.
- Never send Figma nodes or runtime objects across the message boundary.

## State and effects

- Store one source fact and derive related values during render.
- Use effects only to synchronize with messages, timers, browser APIs, or other external systems.
- Clean up listeners and timers.
- Keep async results from overwriting newer selection or state.
- Prefer IDs over duplicated entity objects in UI state.
- Use a discriminated union when flags can represent impossible combinations.

## Local source of truth

- The Figma file is the sole Project source.
- `documentchange` may reconcile local deletion, names, order, and Flow geometry.
- Do not introduce accounts, remote persistence, revision sync, custom MCP, or Project JSON import/export.

Use the checklist in `checklists/review-checklist.md` for affected UI or Plugin paths.
