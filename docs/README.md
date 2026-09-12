# Sketchy 문서 안내

처음부터 전부 읽을 필요는 없다. 맡은 역할과 하려는 일에 맞는 문서부터 시작한다. 현재 결정은 `product`와 `development` 문서가 기준이며, `archive`는 이전 맥락을 확인할 때만 사용한다.

## 디자이너

1. [제품 개요](./product/overview.md) — Sketchy가 해결하는 문제와 지키려는 제품 원칙
2. [제품 경험](./product/experience.md) — Build, Flow, Spec이 연결되는 방식
3. [기능 모델](./product/feature-model.md) — 화면 요소의 동작과 Interaction UI 원칙
4. [기능 명세서 만들기](./workflows/functional-spec.md) — 실제 화면 캡처를 포함한 기능 명세 생성 절차

## 기획자 · PM

1. [제품 개요](./product/overview.md) — 가설, 대상 사용자, 제품 경계
2. [범위와 로드맵](./product/roadmap.md) — MVP 범위, 성공 기준, 이후 후보
3. [기존 페르소나 검증 종합](../persona/00-독립_페르소나_연구_종합.md) — 지금까지 반복 확인된 사용성 문제

## 개발자

1. [기능 모델](./product/feature-model.md) — 현재 도메인 규칙과 UI 제약
2. [기술 설계](./development/architecture.md) — 런타임 구조, 도메인 타입, 메타데이터
3. [Sketchy MCP v1 설계](./development/mcp-v1.md) — Agent 호환, Batch 변경과 Figma Projection 계약
4. [범위와 로드맵](./product/roadmap.md) — 구현 범위와 완료 조건

## Claude · AI 에이전트

- Claude 진입점: 루트의 [`CLAUDE.md`](../CLAUDE.md)
- 페르소나 생성 또는 UX 검증 요청: [AI 페르소나 검증 실행 가이드](./research/persona-validation.md)
- 기능 명세서 생성 요청: [기능 명세서 생성 가이드](./workflows/functional-spec.md)
- 상호작용 UI 변경: [기능 모델의 Interaction UI 원칙](./product/feature-model.md#interaction-ui-원칙)
- 일반 개발 작업: 루트의 [`AGENTS.md`](../AGENTS.md)

## 보관 문서

- [v4 통합 원문](./archive/SKETCHY_PROJECT_v4.md) — 분리 전 원본. 현재 문서와 충돌하면 위 주제별 문서를 따른다.
