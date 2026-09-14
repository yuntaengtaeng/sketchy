# Figma Plugin API 사용 현황

Sketchy Plugin(`src/plugin/`)이 실제로 사용하는 Figma Plugin API를 정리한다.
API 자체의 역할과 이 프로젝트에서의 실제 쓰임을 함께 적는다. 타입 정의는
`@figma/plugin-typings`를 따른다.

## Document, Node 조회

### `figma.getNodeByIdAsync(id)`

역할: Node ID로 해당 문서 안의 Node를 비동기로 찾는다. `dynamic-page`
manifest에서는 페이지가 미리 로드되어 있지 않을 수 있어 동기 버전
(`getNodeById`) 대신 이 비동기 버전을 쓴다.

사용처: Sketchy Project의 각 Screen/Element는 `nodeId`로 실제 Figma Node를
가리킨다. 거의 모든 Plugin 명령(`canvas/*.ts`, `apply-project-import.ts`)이
저장된 `nodeId`로 실제 Node를 다시 찾아 존재 여부를 확인하고 조작할 때
이 함수를 쓴다.

### `figma.currentPage` / `figma.setCurrentPageAsync(page)`

역할: 현재 보고 있는 Page를 읽거나 바꾼다. `dynamic-page`에서는
`setCurrentPageAsync`로 전환해야 해당 Page의 Node에 접근할 수 있다.

사용처: `canvas/utils.ts`의 `focusNode`가 선택하려는 Node가 다른 Page에
있으면 먼저 그 Page로 전환한다.

### `figma.loadAllPagesAsync()`

역할: `dynamic-page` manifest에서 모든 Page를 한 번에 로드한다. 로드 전에는
`figma.root.children`(Page 목록)에 접근할 수 없다.

사용처: `main.ts`가 시작할 때 한 번 호출해 `documentchange` 이벤트를 등록할
수 있는 상태로 만든다.

## Node 생성

### `figma.createFrame()` / `figma.createText()`

역할: 새 Frame(레이아웃 컨테이너) 또는 Text Node를 만든다.

사용처: `canvas/element-render.ts`의 `createElementNode`가 Element 타입에
따라 Frame(button/input/image/divider/section) 또는 Text(text)를 만든다.
`canvas/screen.ts`의 `createScreenNode`가 Screen용 Frame을 만든다.
`flow/connector.ts`가 연결선 라벨용 Text를 만든다.

### `figma.createLine()` / `figma.createRectangle()`

역할: 직선/사각형 Node를 만든다.

사용처: `flow/generated.ts`가 Flow 탭의 화면 간 연결선(`createLine`)을 그릴
때 쓴다. 이 Line Node들은 `sketchy:flow-generated` Plugin Data로 표시해
다음 렌더링 때 구분해서 지운다. `canvas/screen.ts`는 Popup Screen을 만들 때
뒤에 깔리는 반투명 Dim 배경(`createRectangle`)을 만드는 데 쓴다.

## Node 조작

### `parent.appendChild(child)`

역할: `child`를 `parent`의 마지막(맨 위 Z-order) 자식으로 넣는다. 이미 다른
부모에 속해 있으면 그 부모에서 제거된 뒤 옮겨진다.

사용처: 새 Element/Screen을 만들 때(`createElementNode`, `createScreenNode`)
기본 삽입 방법. `canvas/element.ts`의 `moveElement`는 형제 순서를 바꿀 때도
이 함수만 쓴다 — 원하는 최종 순서대로 반복 호출해 다시 쌓는 방식으로,
아래 `insertChild`의 self-move 한계를 피한다.

### `parent.insertChild(index, child)`

역할: `child`를 `parent.children`의 지정한 `index` 위치에 넣는다.

사용처와 주의: `flow/connector.ts`가 라벨을 맨 앞(`index 0`)에 넣을 때처럼
**새로 만든 Node**를 특정 위치에 넣을 때는 문서화된 대로 정확히 동작한다.
반면 **이미 그 parent의 자식인 Node를 다시 정렬**하는 데 쓰려고 하면(예:
형제 순서 맞바꾸기) 실제로 no-op이 되는 경우가 실측으로 확인됐다 — Figma의
내부 fractional indexing과 self-move 처리가 문서에 명시되지 않은 방식으로
동작한다. 그래서 `moveElement`는 `insertChild` 대신 `appendChild` 반복
방식을 쓴다.

### `node.resize(width, height)`

역할: Node 크기를 바꾼다.

사용처: `createElementNode`, `createScreenNode`가 새로 만든 Node의 초기
크기를 정할 때 쓴다.

### `node.remove()`

역할: Node를 문서에서 삭제한다.

사용처: `deleteElement`, `deleteScreen`, `apply-project-import.ts`의 삭제
동기화, `flow/generated.ts`의 이전 렌더링 정리 등 Element/Screen 삭제가
일어나는 모든 곳.

### Auto Layout 속성 (`layoutMode`, `primaryAxisSizingMode`, `itemSpacing`, `layoutSizingHorizontal` 등)

역할: Frame을 Auto Layout 컨테이너로 만들고 정렬·간격·크기 반응을 정한다.

사용처: Sketchy의 모든 Screen과 Element Frame은 Auto Layout으로 만들어져서
Element를 추가·삭제·순서 변경해도 자동으로 다시 배치된다(`element-render.ts`,
`screen.ts`, `screen-clone.ts`). 이 덕분에 `moveElement`가 Node 순서만
바꾸면 화면 위치는 Figma가 알아서 다시 계산해준다.

## Plugin Data

### `node.setPluginData(key, value)` / `node.getPluginData(key)`

역할: Node에 문자열 key-value를 저장한다. Plugin 사이에는 공유되지 않고,
같은 Plugin(manifest `id` 기준)에서만 읽을 수 있다.

사용처: `sketchy:screen-id`, `sketchy:element-id`, `sketchy:type`,
`sketchy:role`처럼 어떤 Figma Node가 어떤 Sketchy Element/Screen에
대응하는지 표시한다. 선택 상태 판정(`selection()` in `main.ts`), 형제 판정
(`moveElement`가 `sketchy:element-id`로 진짜 형제만 필터링) 등 Node ↔ 모델
매핑 전반에 쓰인다.

### `figma.root.setPluginData(key, value)` / `figma.root.getPluginData(key)`

역할: 문서 전체(RootNode) 단위로 데이터를 저장한다. `node.setPluginData`와
달리 특정 Node가 아니라 파일 전체에 귀속된다.

사용처: `storage/project.ts`가 Sketchy Project 전체(JSON), Project
Metadata(id/revision), 동기화 상태(`sketchy:sync-state`)를 여기에 저장한다.
Figma 파일 자체가 로컬 저장소 역할을 한다.

## UI ↔ Plugin 통신

### `figma.showUI(html, options)`

역할: Plugin의 UI(iframe, 실제 브라우저 컨텍스트)를 띄운다.

사용처: `main.ts` 최상단에서 한 번 호출, `themeColors: true`로 Figma
다크/라이트 테마를 UI에 전달한다.

### `figma.ui.postMessage(message)` / `figma.ui.onmessage`

역할: Plugin 메인 스레드(figma.* API를 쓸 수 있는 샌드박스)와 UI
iframe(React가 도는 일반 브라우저 컨텍스트) 사이 메시지를 주고받는다. 두
컨텍스트는 완전히 분리되어 있어 이 메시지 채널이 유일한 통신 수단이다.

사용처: `PluginMessage`(UI → Plugin, `INSERT_BLOCK`/`MOVE_ELEMENT`/
`CONNECT_AGENT` 등)와 `UiMessage`(Plugin → UI, `STATE`/`SYNC_STATUS`/
`ERROR` 등) 타입으로 계약을 명시하고 `main.ts`의 `figma.ui.onmessage`
핸들러가 전부 처리한다.

## 선택, 뷰포트

### `figma.currentPage.selection`

역할: 현재 Canvas에서 선택된 Node 목록을 읽거나(get) 지정한다(set).

사용처: `main.ts`의 `selection()`이 선택된 Node를 따라 올라가며
`sketchy:screen-id`/`sketchy:element-id`를 찾아 Sidebar에 반영한다.
`insertBlock`, `focusNode`가 새로 만들거나 선택할 Node를 지정할 때도 쓴다.

### `figma.viewport.center`

역할: Canvas 보기의 중심 좌표를 옮긴다(카메라 이동).

사용처: `focusNode`가 Element를 선택할 때 그 Node가 화면 중앙에 오도록
뷰포트를 이동시킨다.

### `figma.on("selectionchange" | "documentchange", callback)`

역할: 선택 변경, 문서 변경 이벤트를 구독한다.

사용처: `main.ts`가 `selectionchange`로 Sidebar 선택 상태를 갱신하고,
`documentchange`(디바운스 후)로 사용자가 Figma에서 직접 편집한 내용을
감지해 Sketchy Project에 반영한다 — 자동 양방향 동기화의 로컬 편집 감지
경로([Remote MCP와 Sketchy API](./remote-mcp.md#자동-양방향-동기화) 참고).

## Text, Font

### `figma.loadFontAsync(fontName)`

역할: Text Node에 폰트를 적용하기 전에 반드시 그 폰트를 로드해야 한다.

사용처: `canvas/utils.ts`의 `loadFont()`가 `Inter Regular`를 로드하는
헬퍼로, Text를 만들거나 수정하는 모든 명령 앞에서 호출한다.

## Prototype 연결 (Reaction)

### `node.reactions` (읽기) / `node.setReactionsAsync(reactions)` (쓰기)

역할: Node의 Prototype 인터랙션(클릭 시 어디로 이동하는지 등)을 읽고
쓴다. Auto Layout처럼 Figma의 네이티브 Prototype 기능이라 Sketchy 밖에서도
그대로 재생해볼 수 있다.

사용처: `canvas/feature.ts`의 `syncReaction`이 Sketchy의 Feature(버튼 클릭
→ 화면 이동/팝업 열기/닫기)를 실제 Figma Prototype 연결로 변환해서 저장한다.
Sketchy가 만들지 않은 다른 Reaction은 건드리지 않고 보존한다
(`sync-prototype.ts`의 `withoutMissingDestinations`/`updateNavigation`).

## 알림

### `figma.notify(message, options)`

역할: Canvas 위에 Toast 메시지를 띄운다. Sidebar UI와 별개로 항상 Canvas
위에 뜨기 때문에, 사용자가 Sidebar의 다른 탭을 보고 있어도 놓치지 않는다.
`options.error`로 빨간색 오류 스타일을, `options.timeout`으로 노출 시간을
바꿀 수 있다.

사용처: `main.ts`가 자동 동기화 결과 중 사용자가 놓치면 곤란한 것만 골라
알린다 — Agent 변경이 Canvas에 반영됐을 때, 충돌로 동기화를 건너뛸 때,
Agent가 보낸 변경이 구조적으로 지원되지 않아 적용하지 못했을 때
([Remote MCP와 Sketchy API의 자동 양방향 동기화](./remote-mcp.md#자동-양방향-동기화)
참고). 반대로 로컬 편집을 서버에 올리는 데 성공한 것은 알리지 않는다 —
사용자 자신이 방금 한 일이라 새로 알 내용이 없기 때문이다.

## Client 저장소

### `figma.clientStorage.getAsync(key)` / `setAsync(key, value)` / `deleteAsync(key)`

역할: `root.setPluginData`와 달리 **파일이 아니라 사용자·기기** 단위로
저장되는 key-value 저장소다. 이 Figma 계정으로 어떤 파일을 열어도
공유된다.

사용처: `main.ts`가 Sketchy 로그인 세션(`sketchy:auth-session`)을 여기에
저장한다. 로그인은 계정 단위 개념이라 파일마다 다시 로그인할 필요가 없다.

## 더 알아두면 좋은 Figma Plugin API

지금은 안 쓰지만 앞으로 기능을 넓힐 때 참고할 만한 API들이다.

- **`figma.variables`** — Figma Variables(색상/숫자/문자열 토큰)를 만들고
  읽는다. 지금 Sketchy는 색상을 하드코딩(`element-render.ts`)하는데,
  디자인 시스템 연동을 하게 되면 이 API로 옮길 수 있다.
- **`figma.createComponent()` / `node.createInstance()`** — 진짜 Figma
  Component/Instance를 만든다. 지금은 매번 새 Frame을 복제 생성하는데,
  반복되는 Element(버튼 등)를 Component화하면 Figma 쪽에서 일괄 스타일
  변경이 쉬워진다.
- **`figma.combineAsVariants()`** — 여러 Component를 하나의 Variant
  Set으로 묶는다. Button의 filled/outline 같은 변형을 Variant로
  표현하고 싶을 때 후보.
- **`node.exportAsync(settings)`** — Node를 PNG/SVG/PDF 등으로
  내보낸다. 지금 Export는 Markdown 텍스트뿐인데, 화면 썸네일을 함께
  내보내는 기능을 붙이면 유용할 수 있다.
- **`figma.mixed`** — 여러 Node를 한 번에 다룰 때 속성 값이 서로 다르면
  반환되는 특수 심볼. 지금은 항상 단일 Node만 다루므로 안 나오지만,
  다중 선택 편집을 지원하게 되면 꼭 처리해야 한다.
- **`figma.skipInvisibleInstanceChildren`** — Instance 내부의 보이지
  않는 Node를 순회에서 건너뛰어 성능을 높인다. Component/Instance를
  다루게 되면 큰 파일에서 유용하다.
- **`figma.triggerUndo()` / `figma.saveVersionHistoryAsync()`** — 실행
  취소나 버전 기록 저장을 직접 트리거한다. Agent가 큰 Batch를 적용하기
  직전에 버전 스냅샷을 남기는 안전장치로 고려할 수 있다.
- **`node.relaunchData` / `figma.showUI`의 `relaunchButtons`** — 특정
  Node를 다시 선택했을 때 "Sketchy로 편집" 같은 바로가기 버튼을 Figma
  자체 UI에 노출한다. Sidebar를 안 열어도 진입점을 만들 수 있다.

각 API의 정확한 타입과 옵션은 `node_modules/@figma/plugin-typings/`
또는 https://www.figma.com/plugin-docs/api/api-reference/ 를 참고한다.
