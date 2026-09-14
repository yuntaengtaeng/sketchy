---
name: sketchy-mcp
description: Apply Sketchy-specific MCP tool, schema, transport, project-selection, and Preview/Apply safety principles when changing or reviewing src/mcp, MCP manifests, transports, or agent workflows.
---

# Sketchy MCP

`sketchy-code-style`을 먼저 적용한다. Tool과 Batch 계약은 `docs/development/mcp-v1.md`, remote transport는 `docs/development/remote-mcp.md`를 기준으로 한다.

## Scope

`src/mcp`, MCP Tool/schema/transport, `mcpb/manifest.json`, Preview → 승인 → Apply 흐름에 적용한다. 변경 검증은 `core`, 인증·저장은 API/service, Figma 반영은 Plugin 책임이다.

## 필수 원칙

1. **읽기와 변경을 분리한다.** 조회 Tool과 Preview는 저장하지 않으며 상태 변경은 Apply에서만 일어난다.
2. **Apply 전에 Preview와 명시적 사용자 승인을 거친다.** client가 생략해도 server가 exact request와 `previewId`를 검증한다.
3. **승인된 정확한 batch만 적용한다.** Preview 후 request를 수정하거나 warning을 숨기거나 자동 Apply하지 않는다.
4. **모든 Tool 입력을 strict schema로 검증한다.** ID·문자열 길이·정수·범위·non-empty patch·batch 크기 제한을 유지한다.
5. **동시성과 재시도를 안전하게 처리한다.** stale revision, preview mismatch, invalid batch, idempotency key reuse를 실패시키고 새 key로 중복 변경을 만들지 않는다.
6. **도메인 변경을 Tool handler에 구현하지 않는다.** change 의미와 validation은 `core`의 discriminated union과 Preview/Apply 경로에 둔다.
7. **transport 차이를 Tool 계약에 새지 않게 한다.** local file과 remote API access는 같은 `ProjectAccess` 의미를 유지한다.
8. **Model 변경과 Figma 반영을 구분한다.** Apply 성공을 Canvas 반영 완료로 표현하지 않고 Projection 상태를 전달한다.

## Tool과 schema

- 기본 Tool은 `get_project`, `get_screen`, `preview_project_changes`, `apply_project_changes`의 읽기·Batch 계약을 유지한다.
- 단일 entity CRUD나 alias Tool은 독립된 사용자 작업과 안전 경계가 생기기 전에는 추가하지 않는다.
- 조회 Tool에만 `readOnlyHint`를 두며 결과는 serializable content로 제한한다.
- schema 변경 시 TypeScript 타입, core validation, fixture, 문서와 local/remote 소비자를 함께 추적한다.
- Agent 읽기 비용을 위해 Project 요약과 상세 Screen 응답의 분리를 유지한다.

## Preview와 Apply 불변식

- 현재 revision으로 `baseRevision`을 만들고 Preview는 summary, warning, affected entity와 오류만 반환한다.
- Apply는 같은 request, `previewId`, idempotency key로 원자 처리한다.
- `RECORD_FIGMA_PROJECTION` 단독 batch만 canonical revision을 유지할 수 있다. 다른 변경과 섞이면 Projection을 pending으로 내린다.
- Project가 여러 개면 임의로 선택하지 않고 명시적인 project selection을 요구한다.
- request-scoped principal과 Project context를 전역 mutable state로 공유하지 않는다.

## 검증

- Tool 변경은 등록 이름, schema rejection, annotation과 반환 payload를 MCP test에서 검증한다.
- change/schema 변경은 invalid Preview와 stale revision 또는 Preview mismatch 중 영향받는 안전 경계를 검증한다.
- local/remote 공통 변경은 두 adapter가 같은 Tool 의미를 유지하는지 확인한다.
- manifest/package 변경은 `tests/mcpb-manifest.test.ts`와 `npm run build:mcpb`까지 검증한다.

