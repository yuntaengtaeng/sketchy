# 기술 설계

기술 검증 항목, 런타임 구조, 데이터 타입과 메타데이터 원칙을 설명한다.

## Technical Spike Before Product Development

제품 기능 개발 전에 Figma Plugin API가 Sketchy의 핵심 모델을 지원하는지
작은 코드로 검증한다.

가장 먼저 확인할 것은 **Feature → Destination 관계를 실제 Figma
Prototype 연결로 안정적으로 생성할 수 있는가**이다.

최소 Spike:

```text
Screen A
  │
Button
  │
  │ Sketchy에서 Destination 지정
  ▼
Screen B
```

검증 항목:

- Plugin API를 통해 Prototype reaction을 생성할 수 있는가
- Button → Screen navigation을 원하는 형태로 설정할 수 있는가
- 기존 Prototype 설정과 충돌할 때 어떻게 처리할 것인가
- Node가 삭제/복제/이동되었을 때 Sketchy metadata를 어떻게 유지할
  것인가
- Sketchy Connection과 Figma Prototype 중 어느 쪽을 Source of Truth로
  둘 것인가

기술 Spike가 실패하거나 제약이 크다면 Product UX를 구현에 맞춰 조정한다.

Block Picker와 전체 UI를 먼저 만드는 것보다 이 핵심 연결 가능성을 먼저
검증한다.

## Recommended Technical Architecture

Figma Plugin은 크게 두 영역으로 분리한다.

```text
Figma Sandbox
      │
      │ postMessage
      ▼
Plugin UI
```

### Plugin Code

책임:

- Figma Node 조회
- Frame 생성
- Component 생성
- Auto Layout 설정
- Prototype 설정
- Plugin Data 저장
- Selection 감지

### UI

책임:

- Wireframe Library
- Interaction Editor
- Spec Editor
- Flow Viewer
- Present Mode

## Technical Stack

Sketchy의 기본 기술 스택은 다음과 같이 구성한다.

- Figma Plugin API
- React
- TypeScript
- Vite

### Architecture

React는 Sketchy의 **Plugin UI**를 담당한다.

실제 Figma Canvas 조작은 React에서 직접 수행하지 않고 Plugin Runtime을
통해 수행한다.

```text
React UI
    │
    │ postMessage
    ▼
Plugin Runtime (TypeScript)
    │
    │ Figma Plugin API
    ▼
Figma Canvas
```

#### Plugin UI --- React

책임:

- Block Picker
- Screen Details
- Screen Feature 편집
- Flow
- Spec
- Present Mode

#### Plugin Runtime --- TypeScript

책임:

- Figma Node 생성 / 수정
- Selection 감지
- Auto Layout 구성
- Prototype 연결
- Plugin Data 저장 / 조회
- UI에서 전달받은 Command 실행

#### Shared

Plugin UI와 Plugin Runtime 사이에서 공유하는 순수 TypeScript 영역이다.

책임:

- Domain Types
- UI ↔ Plugin Message Types
- Constants
- Validation

특히 UI와 Runtime 사이의 메시지는 명시적인 타입으로 관리한다.

```ts
type PluginMessage =
  | {
      type: "CREATE_SCREEN";
    }
  | {
      type: "INSERT_BLOCK";
      block: "button" | "input" | "table";
    }
  | {
      type: "UPDATE_SCREEN";
      screenId: string;
      description: string;
    };
```

React UI:

```ts
parent.postMessage(
  {
    pluginMessage: {
      type: "INSERT_BLOCK",
      block: "button",
    },
  },
  "*",
);
```

Plugin Runtime:

```ts
figma.ui.onmessage = (message: PluginMessage) => {
  if (message.type === "INSERT_BLOCK") {
    // Figma Plugin API를 사용하여 실제 Node 생성
  }
};
```

핵심 원칙:

> **React는 Sketchy UI를 만들고, Figma Plugin API는 Sketchy가 만드는
> 실제 Canvas를 다룬다.**

## Suggested Project Structure

```text
sketchy/
│
├─ src/
│  ├─ plugin/
│  │  ├─ main.ts
│  │  │
│  │  ├─ commands/
│  │  │  ├─ create-screen.ts
│  │  │  ├─ insert-block.ts
│  │  │  ├─ create-interaction.ts
│  │  │  └─ sync-prototype.ts
│  │  │
│  │  ├─ nodes/
│  │  │  ├─ screen.ts
│  │  │  ├─ button.ts
│  │  │  ├─ input.ts
│  │  │  ├─ list.ts
│  │  │  └─ table.ts
│  │  │
│  │  └─ storage/
│  │     └─ plugin-data.ts
│  │
│  ├─ ui/
│  │  ├─ App.tsx
│  │  │
│  │  ├─ features/
│  │  │  ├─ build/
│  │  │  ├─ interaction/
│  │  │  ├─ spec/
│  │  │  ├─ flow/
│  │  │  └─ present/
│  │  │
│  │  └─ components/
│  │
│  ├─ core/
│  │  ├─ screen/
│  │  ├─ element/
│  │  ├─ interaction/
│  │  ├─ flow/
│  │  └─ spec/
│  │
│  └─ shared/
│     ├─ types/
│     ├─ messages/
│     ├─ validation/
│     └─ constants/
│
├─ manifest.json
├─ package.json
└─ README.md
```

## Domain Types

비즈니스 데이터는 가능한 Figma API와 분리한다.

```ts
type Screen = {
  id: string;
  nodeId: string;
  name: string;
  purpose?: string;
  states: ScreenState[];
};

type ScreenState =
  "default" | "loading" | "empty" | "error" | "disabled" | "custom";

type Element = {
  id: string;
  nodeId: string;
  screenId: string;
  name: string;
  type: ElementType;
};

type ElementType =
  | "button"
  | "input"
  | "text"
  | "image"
  | "list"
  | "table"
  | "navigation"
  | "custom";

type Interaction = {
  id: string;
  sourceElementId: string;
  trigger: Trigger;
  action: Action;
  destinationScreenId?: string;
  condition?: string;
  otherwise?: string;
};

type Trigger = "click" | "change" | "submit" | "open" | "close";

type Action =
  | "navigate"
  | "back"
  | "open-modal"
  | "open-bottom-sheet"
  | "close"
  | "show-message"
  | "external-link";
```

## Metadata

Sketchy가 관리하는 Node에는 pluginData를 사용하여 식별 정보를 저장한다.

개념 예:

```text
sketchy:type = screen
sketchy:id = screen-product-detail
```

Element:

```text
sketchy:type = element
sketchy:id = purchase-button
sketchy:screen-id = screen-product-detail
```

내부 데이터의 ID와 Figma node.id를 분리한다.

Figma Node가 변경되더라도 Sketchy의 Domain Model이 Figma 구현에 지나치게
의존하지 않도록 한다.
