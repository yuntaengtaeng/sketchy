# Sketchy

Low-fi screens, interactions, flows, and specs in one Figma plugin.

## Documentation

- [문서 안내](./docs/README.md) — 역할별 문서 시작점
- [제품 개요](./docs/product/overview.md) — 문제, 가설, 사용자, 제품 원칙
- [기능 모델](./docs/product/feature-model.md) — Feature, Action, Interaction UI 기준
- [AI 페르소나 검증 실행 가이드](./docs/research/persona-validation.md) — 페르소나 생성·검증 절차

## Run

```sh
npm install
npm run build
```

In Figma Desktop, import `manifest.json` via **Plugins → Development → Import plugin from manifest**.

Create two screens, add a button to the first, select that button on the canvas, and choose the second screen under **Go to**. The Flow and Spec tabs update from the same interaction.
