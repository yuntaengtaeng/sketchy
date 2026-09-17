# Figma Plugin API 사용 현황

## 실행 경계

Sketchy는 Plugin Main과 React UI를 분리한다.

- Plugin Main: `figma.*`, Canvas 탐색·변경, plugin data 저장
- React UI: 사용자 입력과 상태 표시
- 통신: `PluginMessage`와 `UiMessage`의 직렬화 가능한 값

## 사용하는 API

### UI와 메시지

- `figma.showUI`: 360×720 사이드바를 연다.
- `figma.ui.onmessage`: UI 명령을 받는다.
- `figma.ui.postMessage`: Project와 selection 또는 오류를 UI에 보낸다.

### Canvas 생성과 탐색

- `figma.createFrame`, `createText`, `createRectangle`, `createEllipse`: low-fi 요소를 만든다.
- `figma.getNodeByIdAsync`: 저장된 nodeId의 현재 존재 여부와 값을 확인한다.
- `figma.loadAllPagesAsync`: 문서 변경 감지를 등록하기 전에 페이지를 로드한다.
- `figma.loadFontAsync`: Text Node 수정 전에 폰트를 준비한다.

### 선택과 보기

- `figma.currentPage.selection`: 현재 Screen/Element 선택을 UI와 맞춘다.
- `figma.viewport`: 생성하거나 선택한 Node로 이동한다.
- `selectionchange`: selection만 UI에 다시 보낸다.

### 파일 내부 저장

- `figma.root.getPluginData` / `setPluginData`: 현재 Figma 파일의 Sketchy Project를 저장한다.
- Node plugin data: Sketchy Screen/Element/role ID를 Canvas Node와 연결한다.

별도 계정 저장소인 `figma.clientStorage`는 사용하지 않는다.

### Interaction과 Flow

- `node.reactions` / `setReactionsAsync`: Sketchy Feature를 Figma Prototype 연결로 반영한다.
- `documentchange`: 삭제·이름·순서·위치 변경을 현재 파일에서 보정하고 Flow 선을 다시 계산한다.

`documentchange`는 서버 동기화나 외부 변경 감지가 아니다. Figma Canvas가 원본이므로, 사용자가 플러그인을 켜거나 끈 상태에서 직접 수정한 결과를 로컬 Project 표현과 맞추는 용도다.

## 네트워크

현재 플러그인은 네트워크 요청을 하지 않으며 manifest에 `networkAccess`를 선언하지 않는다.
