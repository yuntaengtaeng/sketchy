# Sketchy MCP v1 설계

이 문서는 Sketchy를 Codex, Claude Code, Claude Desktop에서 사용하기 위한
Phase 0 계약이다. Server Framework보다 제품 데이터와 변경 경계를 먼저
고정한다.

## 목표 경험

```text
사용자 자연어 요청
  ↓
Codex / Claude
  ↓ Sketchy MCP
Sketchy Project 변경
  ↓ Projection
Figma Canvas 반영
```

Agent는 Figma Node를 직접 조립하기 전에 Screen, Element, Feature로 구성된
Sketchy 의미 모델을 변경한다. Figma Canvas는 이 모델의 표현 결과다.

## Client 호환

Sketchy MCP는 특정 Agent SDK에 의존하지 않는 표준 Remote MCP Server로
만든다.

- Codex
- Claude Code
- Claude Desktop

Tool 이름, JSON Schema, OAuth Scope와 오류 응답은 모든 Client에 동일하다.
Client별 설치와 설정은 Adapter/배포 문제이며 도메인 Tool에 포함하지 않는다.

공식 참고:

- Codex MCP: https://learn.chatgpt.com/docs/extend/mcp?surface=cli
- Claude Remote MCP: https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers
- Claude Desktop Local MCP: https://support.anthropic.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop

## Source of Truth

실제 쓰기 연동을 시작할 때 Canonical Store는 revision을 가진 Sketchy API
Project다.

```text
                 Sketchy API
               Project + Revision
                  /          \
          Figma Plugin     Sketchy MCP
                |
            Figma Canvas
```

- Plugin과 MCP는 같은 API Project를 읽고 변경한다.
- Sketchy Model이 의미의 원본이다.
- Figma Canvas는 Project의 Projection이다.
- Figma `pluginData`는 현재 로컬 저장소로만 유지한다.
- API 전환 시 기존 `pluginData` Project를 한 번 가져오는 migration을 둔다.

## Canonical Project

```ts
type SketchyProjectDocument = {
  id: string;
  revision: number;
  updatedAt: string;
  project: Project;
  figmaProjection?: FigmaProjection;
};

type FigmaProjection = {
  fileKey: string;
  status: "pending" | "synced" | "failed";
  lastSyncedRevision?: number;
  nodes: Record<string, string>; // Sketchy entity id → Figma node id
  lastError?: string;
};
```

Figma mapping은 Screen이나 Element에 섞지 않는다. v1은 한 Project와 한 Figma
파일만 지원한다. Connection도 별도 저장하지 않는다.

```text
Feature.action.destinationScreenId
  ↓ 파생
Connection / Flow / Prototype
```

## Batch Change

실행 가능한 입력 계약은
[MCP v1 Project Change JSON Schema](./schemas/mcp-v1-project-change.schema.json)에
정의한다. TypeScript Core 타입과 JSON Schema가 표현하는 필드는 동일하게
유지한다.

개별 CRUD Tool을 여러 번 호출하는 대신 하나의 변경 묶음을 Preview하고
적용한다.

```ts
type ProjectChangeRequest = {
  projectId: string;
  baseRevision: number;
  idempotencyKey: string;
  changes: ProjectChange[];
};

type ProjectChange =
  | { type: "CREATE_SCREEN"; screen: ScreenInput }
  | { type: "UPDATE_SCREEN"; screenId: string; patch: ScreenPatch }
  | { type: "DELETE_SCREEN"; screenId: string }
  | { type: "ADD_ELEMENT"; element: ElementInput }
  | { type: "UPDATE_ELEMENT"; elementId: string; patch: ElementPatch }
  | { type: "DELETE_ELEMENT"; elementId: string }
  | { type: "SET_ELEMENT_ACTION"; elementId: string; action: FeatureAction }
  | { type: "CLEAR_ELEMENT_ACTION"; elementId: string }
  | { type: "ADD_ELEMENT_CASE"; elementId: string; case: FeatureCaseInput }
  | { type: "UPDATE_ELEMENT_CASE"; featureId: string; patch: FeatureCasePatch }
  | { type: "REMOVE_ELEMENT_CASE"; featureId: string }
  | { type: "RECORD_FIGMA_PROJECTION"; projection: ProjectionResult };
```

Agent에게는 내부 Feature 생성보다 선택한 Element의 결과를 설정한다는 언어를
제공한다. 내부적으로 Element Action/Case 변경이 Feature를 생성하거나
갱신한다.

Preview와 Apply는 같은 검증기를 사용한다.

- `baseRevision`, ID와 idempotency key 중복 확인
- Screen, Element, Feature 참조 무결성 확인
- Parent가 같은 Screen에 속하는지 확인
- Section 중첩은 한 단계까지만 허용
- Element가 요청한 Trigger/Action을 지원하는지 확인
- Navigate/Overlay Destination 존재 여부 확인
- 삭제 영향을 Preview에 표시
- 하나라도 유효하지 않으면 아무것도 저장하지 않음

Apply 성공 시 Batch 전체를 한 번 저장하고 revision을 1 증가시킨다. 부분
성공은 허용하지 않는다.

## MCP Tool

### `get_project`

Project, revision과 Figma Projection 상태를 반환한다. 큰 Project는 요약과
Screen 목록을 기본값으로 반환한다.

### `get_screen`

하나의 Screen, 하위 Element, Feature와 Figma mapping을 반환한다.

### `preview_project_changes`

변경을 저장하지 않고 검증한다.

```ts
type ChangePreview = {
  previewId: string;
  baseRevision: number;
  summary: string[];
  warnings: string[];
  affectedEntityIds: string[];
  projectionTasks: FigmaProjectionTask[];
};
```

### `apply_project_changes`

사용자가 검토한 `previewId`와 동일한 request를 적용한다. Preview 이후
revision이나 내용이 달라졌으면 다시 Preview한다. 삭제와 덮어쓰기는 Client
승인 UI가 있더라도 Server 검증과 summary를 생략하지 않는다.

## Figma Projection

Figma Remote MCP의 `use_figma`는 native Figma content를 만들고 수정할 수
있으며 Codex, Claude Code와 Claude Desktop을 지원 Client로 명시한다.

- https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/
- https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/

```text
get_project
  ↓
preview_project_changes
  ↓ 사용자 승인
apply_project_changes
  ↓ Project revision 저장, Projection pending
Figma MCP로 작은 Projection task 실행
  ↓
생성/수정된 nodeId 재조회
  ↓
RECORD_FIGMA_PROJECTION Batch
  ↓ Projection synced 또는 failed
```

Sketchy MCP가 다른 MCP를 직접 호출한다고 가정하지 않는다. Codex나 Claude가
두 Tool 제공자를 조율한다. Projection이 실패해도 의미 모델은 유지하고
`pending` 또는 `failed`에서 재시도한다.

Figma Write to Canvas에는 Full seat와 대상 파일 편집 권한이 필요하며 beta
결과를 수동 검토해야 한다. 큰 변경은 inspect 후 작은 단위로 실행하고
검증한다. Sketchy Batch 하나를 Figma 호출 한 번으로 강제하지 않는다.

## Canvas 직접 수정

```text
Sketchy UI/MCP 변경 → 정식 Project 변경
Figma Canvas 변경  → 외부 변경
```

Plugin이 열려 있으면 `documentchange`로 외부 변경을 감지한다. 닫힌 동안의
변경은 다음 Plugin 실행 또는 Agent 작업 전에 비교한다. 차이가 있으면 자동
덮어쓰기 없이 `Canvas 변경 유지` 또는 `Sketchy로 복원`을 선택하게 한다.

Canvas 변경을 Sketchy 의미 모델로 가져오는 기능은 별도의 명시적인
Import/Adopt 작업이다. v1에서는 자동 역동기화하지 않는다.

## 권한과 보안

- Project별 `project:read`, `project:write` Scope
- Figma fileKey 연결 권한 확인
- OAuth 2.1, PKCE와 token audience 검증
- 다른 MCP나 Figma Token passthrough 금지
- 알 수 없는 JSON 필드 거절
- 요청 크기와 Batch entity 수 제한
- 사용자, Client, before/after revision 감사 로그
- 삭제와 덮어쓰기 Preview 필수

## 단계

### Phase 0 — 현재

- Project envelope, Batch Change와 Projection 경계 확정
- [대표 Batch fixture](./fixtures/mcp-v1-project-changes.json) 작성
- Codex와 Claude가 같은 fixture를 같은 의미로 해석하는지 검증

### Phase 1 — Read only

- Canonical Store와 인증 최소 구현
- `get_project`, `get_screen`
- Codex, Claude Code, Claude Desktop 연결 테스트

현재 로컬 개발 버전은 원격 API 전에 같은 계약을 검증할 수 있도록 JSON 파일을
읽는 stdio MCP Server를 제공한다. 기본 파일은 프로젝트 루트의
`sketchy.project.json`이며 다른 경로는 `--project`로 지정한다.

Figma Plugin의 Settings에서 `Export for Codex or Claude`를 누르면 현재 프로젝트를
해당 파일명으로 내려받는다. Sketchy Screen과 Element에서는 Canvas `nodeId`를
제거하고 `figmaProjection.nodes`에 mapping을 모아 저장한다.

```powershell
npm run mcp -- --project C:\path\to\sketchy.project.json
```

Codex와 Claude Code에는 위 명령을 stdio MCP 명령으로 등록한다. 두 Client 모두
동일한 `get_project`, `get_screen` Tool을 보게 된다. Canonical Store가 Sketchy
API로 바뀔 때는 MCP Tool이 아니라 `readProjectDocument` 경계만 API 호출로
교체한다.

이 단계의 JSON 저장소는 읽기 흐름 검증용이다. Plugin과 Agent가 실시간으로 같은
상태를 공유하는 것은 아니며, 쓰기 기능을 시작하기 전에 API 저장소로 전환한다.

### Phase 2 — Model write

- `preview_project_changes`, `apply_project_changes`
- revision, idempotency와 원자적 검증
- 아직 Figma 자동 반영 없이 변경 결과 검토

현재 `preview_project_changes`는 MCP에 연결되어 있다. Agent가 보낸 Batch를 저장하지
않고 검증하며 `previewId`, 변경 요약, 오류·경고와 영향받는 Entity ID를 반환한다.
같은 요청은 같은 `previewId`를 만든다.

`apply_project_changes`는 같은 `previewId`와 Batch를 다시 받아 revision과
idempotency key를 재검증한다. 성공한 Batch는 임시 파일을 거쳐 한 번에 교체하고
revision을 1 올린다. 같은 idempotency key 재호출은 중복 저장하지 않는다. Figma
Canvas는 아직 수정하지 않고 Projection 상태를 `pending`으로 바꾼다.
Agent는 Preview 요약과 경고를 보여주고 사용자가 명시적으로 승인한 뒤에만 Apply를
호출한다.

Figma Plugin의 `Review agent changes`는 변경된 JSON을 읽어 Project ID와 revision을
확인하고 Screen, Element, Action의 추가·수정·삭제 수를 보여준다. 이 검토 단계는
Canvas를 변경하지 않는다.

현재 Projection은 일반 Screen 생성, 기존 Screen의 이름·Purpose, 기존 Element의
이름·설명, Button style, Section direction과 새 Element를 `Apply to Figma`로
반영한다. 같은 Batch에서 새 Screen과 그 안의 Element를 함께 만들 수 있다. 새
Element는 Section 안에 배치할 수 있고 Section 중첩은 한 단계까지 허용한다. 검토
Button의 기본 Action은 Navigate, Overlay, Close overlay, Describe 결과로 반영하며
Navigate와 Overlay는 Figma Prototype 연결도 갱신한다. 기본 Action을 지우면 해당
Figma Prototype 연결도 제거한다. Element 삭제 시 Section의
하위 요소와 연결된 Action도 함께 제거하며 Popup 역할 Element는 삭제할 수 없다.
Screen 삭제 시 내부 Element, 파생 Popup과 해당 Screen을 향하는 Action 및 Prototype
연결도 함께 제거한다. 조건부 Action Case의 추가·수정·삭제는 Flow와 Spec에
반영하되 Figma의 기본 Click Prototype으로 만들지 않는다. 이후 Figma Project
revision이 달라졌거나 Popup Screen 생성이나 기존 구조 변경이 섞이면 적용하지 않는다.
반영 후 다시 Export하면 JSON Projection도 `synced`로 닫힌다.

### Phase 3 — Figma Projection

- Figma MCP Projection task 생성
- node mapping과 sync status 기록
- 실패 재시도와 외부 변경 감지

## Phase 0에서 결정하지 않는 것

- API Framework, Hosting과 Database 제품
- 과금 모델
- 다중 Figma 파일 Projection
- 실시간 공동 편집
- Canvas → Sketchy 자동 역동기화
- Claude Desktop 전용 DXT 패키지

이 항목은 Phase 1 또는 실제 사용 근거가 생길 때 결정한다.
