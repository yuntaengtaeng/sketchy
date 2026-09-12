# Sketchy × Figma MCP × AI Agent 연동

## 1. 목표

Sketchy를 단순한 Figma Plugin이 아니라 **사람과 AI Agent가 함께 사용할 수 있는 제품 설계 도구**로 확장한다.

사용자는 Claude, Codex 등의 AI Agent에게 자연어로 요청하고, AI는 Sketchy의 구조를 이용해 제품 흐름을 정의한 뒤 Figma Canvas에 실제 와이어프레임을 생성한다.

예:

```text
"쇼핑몰 구매 플로우 만들어줘.

상품 목록 → 상품 상세 → 주문서가 있고,
상품 상세에서는 찜하기와 옵션 선택도 가능해야 해."
```

최종적으로 AI가 다음 구조를 생성하는 것을 목표로 한다.

```text
Screen
├─ 상품 목록
├─ 상품 상세
└─ 주문서

Feature
├─ 상품 선택 → 상품 상세 이동
├─ 구매하기 → 주문서 이동
├─ 찜하기 → 상태 변경
└─ 상품 옵션 → 모달 표시

Connection
상품 목록 → 상품 상세 → 주문서
```

그리고 이 구조를 기반으로 실제 Figma 와이어프레임을 생성한다.

---

# 2. Figma AI와 Figma Plugin

Figma에서 제공하는 AI와 일반적인 Classic Plugin은 구분해야 한다.

현재 공개 Plugin API 기준으로는 다음과 같은 형태는 지원되지 않는다.

```text
Sketchy Plugin
      ↓
Figma AI 호출
      ↓
"이 화면 만들어줘"
```

즉 Plugin 코드에서 임의로 다음과 같은 API를 사용하는 구조가 아니다.

```ts
figma.ai.generate(...)
```

반대 방향도 마찬가지다.

```text
Figma AI
   ↓
Sketchy Plugin 내부 함수 탐색
   ↓
createScreen()
createFeature()
connectScreens()
```

Figma AI가 설치된 서드파티 Classic Plugin의 내부 함수를 자동으로 발견해서 Tool처럼 호출하는 구조가 아니다.

---

# 3. Figma MCP

Figma는 MCP를 제공한다.

이를 통해 Claude, Codex 같은 MCP Client/AI Agent가 Figma와 연결될 수 있다.

개념적으로:

```text
Claude / Codex
      ↓
   Figma MCP
      ↓
    Figma
```

Figma MCP는 Figma 디자인 컨텍스트를 AI에게 제공하고, 지원되는 환경에서는 Figma Canvas에 native Figma content를 생성하거나 수정하는 작업에도 사용할 수 있다.

예:

```text
Frame 생성
Text 생성
Button 생성
Auto Layout 설정
Component 사용
Variable 사용
Canvas 수정
```

따라서 AI Agent가 실제 Figma Canvas를 다루는 역할은 Figma MCP가 담당할 수 있다.

---

# 4. AI가 Sketchy 내부 함수를 자동으로 보는 것은 아니다

Sketchy Plugin 내부에 다음 코드가 있다고 가정한다.

```ts
function createScreen() {}

function createFeature() {}

function connectScreens() {}
```

Claude/Codex에 Figma MCP를 연결한다고 해서 AI가 이 함수들을 자동으로 발견하지 않는다.

구조는 기본적으로 다음과 같다.

```text
Claude / Codex
      ↓
   Figma MCP
      ↓
    Figma

------------------

Sketchy Plugin
      ↓
Plugin 내부 함수
```

두 실행 환경은 별개다.

따라서 AI에게 Sketchy 기능을 사용시키려면 **Sketchy의 기능을 AI Tool로 명시적으로 공개해야 한다.**

그 역할을 하는 것이 `Sketchy MCP`다.

---

# 5. Sketchy MCP

Sketchy 전용 MCP Server를 만든다.

예:

```text
Sketchy MCP

Tools
├─ sketchy_get_project
├─ sketchy_create_screen
├─ sketchy_update_screen
├─ sketchy_create_feature
├─ sketchy_update_feature
├─ sketchy_connect_screens
└─ sketchy_get_flow
```

Claude/Codex에서는 이 기능들이 사용할 수 있는 Tool로 노출된다.

예:

```text
sketchy_create_screen

input:
- name
- description
```

또는:

```text
sketchy_create_feature

input:
- screenId
- name
- trigger
- action
- destinationScreenId
```

AI는 Sketchy의 소스코드를 분석해서 내부 함수를 호출하는 것이 아니다.

**Sketchy MCP가 공개한 Tool을 호출한다.**

---

# 6. 사용자 환경

초기 구조에서는 사용자가 AI Client에 두 개의 MCP를 연결한다.

```text
Claude / Codex
      │
      ├─ Figma MCP
      │
      └─ Sketchy MCP
```

각 MCP의 역할은 명확하게 나눈다.

## Figma MCP

실제 Figma Canvas를 다루는 역할.

```text
"손"
```

담당:

```text
Frame 생성
Node 조회
Text 생성
Component 생성/사용
Auto Layout
Canvas 수정
```

## Sketchy MCP

제품의 의미와 구조를 다루는 역할.

```text
"제품 설계 규칙"
```

담당:

```text
Screen
Feature
Connection
Flow
Spec
```

---

# 7. 전체 구조

```text
                    Claude / Codex
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
        Sketchy MCP               Figma MCP
              │                       │
              ▼                       ▼
        Sketchy Core              Figma Canvas
              │
              ▼
     Screen / Feature / Connection
```

AI가 두 MCP를 조합해서 작업한다.

---

# 8. 실제 사용 예

사용자:

```text
"쇼핑몰 구매 플로우 만들어줘.

상품 목록
상품 상세
주문서

상품 상세에서는 구매, 찜하기,
상품 옵션 선택이 가능해야 해."
```

AI Agent는 먼저 Sketchy MCP를 사용한다.

### 1. Screen 생성

```text
sketchy_create_screen("상품 목록")

sketchy_create_screen("상품 상세")

sketchy_create_screen("주문서")
```

### 2. Feature 생성

```text
상품 선택
action = navigate
destination = 상품 상세
```

```text
구매하기
action = navigate
destination = 주문서
```

```text
찜하기
action = state_change
```

```text
상품 옵션
action = open_modal
```

### 3. Connection 생성

```text
상품 목록
   ↓
상품 상세
   ↓
주문서
```

이 시점에는 아직 제품의 **논리적인 구조**만 만들어졌다.

---

# 9. Figma 와이어프레임 생성

다음으로 AI가 Figma MCP를 사용한다.

```text
상품 목록 Frame 생성

상품 상세 Frame 생성

주문서 Frame 생성
```

각 Screen의 Feature를 참고해서 UI를 만든다.

예:

```text
상품 상세

┌───────────────────────┐
│                       │
│      상품 이미지       │
│                       │
├───────────────────────┤
│ 상품 이름              │
│ 30,000원               │
│                       │
│ [ 상품 옵션 ]          │
│                       │
│ ♡ 찜하기               │
│                       │
│ [ 구매하기 ]           │
└───────────────────────┘
```

여기서 중요한 점은 AI가 임의로 UI를 그리는 것이 아니라 **Sketchy가 정의한 Feature를 기반으로 UI를 구성한다는 것**이다.

---

# 10. Figma Node와 Sketchy Screen 연결

Figma에 Frame을 생성한 뒤 Sketchy Screen과 연결한다.

예:

```ts
interface Screen {
  id: string;

  name: string;

  figma?: {
    fileKey: string;
    nodeId: string;
  };
}
```

그러면:

```text
Sketchy

Screen
id: screen_02
name: 상품 상세

        ↕

Figma

Frame
nodeId: 123:456
```

라는 관계를 만들 수 있다.

---

# 11. Node Mapping의 장점

사용자가 나중에 다음과 같이 요청할 수 있다.

```text
"상품 상세 화면에 리뷰 영역 추가해줘."
```

AI는 먼저 Sketchy MCP에서 Screen을 찾는다.

```text
screen_02
```

그리고 저장되어 있는 Figma mapping을 확인한다.

```text
figma.nodeId
→ 123:456
```

이후 Figma MCP를 사용해서 정확한 Frame을 수정한다.

```text
Sketchy MCP

screen_02 조회
       ↓
figma.nodeId
       ↓
Figma MCP
       ↓
123:456 Frame 수정
```

AI가 매번 Canvas에서 화면을 다시 추측해서 찾을 필요가 없다.

---

# 12. Sketchy Core 분리

Sketchy Plugin 내부에 모든 비즈니스 로직을 넣지 않는다.

피해야 할 구조:

```ts
onClickCreateScreen() {
  // Screen 생성
  // 저장
  // validation
  // connection 처리
}
```

대신 Core를 분리한다.

```text
packages/
   core/
```

Core가 다음 기능을 제공한다.

```ts
createScreen();

updateScreen();

createFeature();

updateFeature();

connectScreens();

getFlow();

getProject();
```

그리고 Plugin과 MCP가 동일한 Core를 사용한다.

---

# 13. 권장 프로젝트 구조

TurboRepo를 사용한다면 다음과 같은 형태로 구성할 수 있다.

```text
sketchy/

apps/
├─ figma-plugin/
│
└─ mcp-server/

packages/
├─ core/
│  ├─ screen/
│  ├─ feature/
│  ├─ connection/
│  └─ project/
│
├─ types/
│
└─ storage/
```

또는 MCP 자체를 package로 관리한다면:

```text
sketchy/

apps/
└─ figma-plugin/

packages/
├─ core/
│
├─ types/
│
├─ storage/
│
└─ mcp/
   ├─ server.ts
   │
   └─ tools/
      ├─ create-screen.ts
      ├─ update-screen.ts
      ├─ create-feature.ts
      ├─ update-feature.ts
      ├─ connect-screens.ts
      ├─ get-project.ts
      └─ get-flow.ts
```

---

# 14. Core와 Adapter

전체적으로는 다음 구조가 된다.

```text
                   Sketchy Core
                  /            \
                 /              \
                ▼                ▼

        Figma Plugin         Sketchy MCP
             │                   │
             ▼                   ▼

           사람             Claude / Codex
```

즉 같은 기능을 두 가지 인터페이스에서 사용한다.

### 사람이 사용하는 경우

```text
Plugin UI
   ↓
createScreen()
   ↓
Sketchy Core
```

### AI가 사용하는 경우

```text
Claude
   ↓
Sketchy MCP
   ↓
createScreen()
   ↓
Sketchy Core
```

---

# 15. Sketchy MCP Tool 예시

예를 들어 Screen 생성 Tool은 개념적으로 다음과 같다.

```ts
server.registerTool(
  "create_screen",
  {
    description: "Sketchy 프로젝트에 새로운 화면을 생성합니다.",

    inputSchema: z.object({
      name: z.string(),
      description: z.string().optional(),
    }),
  },

  async ({ name, description }) => {
    const screen = createScreen({
      name,
      description,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(screen),
        },
      ],
    };
  },
);
```

Feature 역시 동일하다.

```ts
server.registerTool(
  "create_feature",
  {
    description: "특정 Screen에서 사용자가 수행할 수 있는 행동을 정의합니다.",

    inputSchema: z.object({
      screenId: z.string(),

      name: z.string(),

      trigger: z.string(),

      action: z.enum([
        "navigate",
        "state_change",
        "open_modal",
        "close_modal",
        "custom",
      ]),

      destinationScreenId: z.string().optional(),
    }),
  },

  async (input) => {
    return createFeature(input);
  },
);
```

---

# 16. Sketchy MCP MVP

처음부터 너무 많은 Tool을 제공할 필요는 없다.

MVP에서는 다음 정도면 충분하다.

```text
Sketchy MCP v0.1

Tools

├─ get_project
│
├─ create_screen
│
├─ update_screen
│
├─ create_feature
│
├─ update_feature
│
├─ connect_screens
│
├─ update_screen_figma_mapping
│
└─ get_flow
```

필요하면 Resource도 제공한다.

```text
Resources

sketchy://project

sketchy://screens

sketchy://features

sketchy://connections
```

---

# 17. 중요한 설계 원칙

MCP 구현 자체보다 **Sketchy Core API 설계가 더 중요하다.**

AI에게 다음과 같은 저수준 API를 주는 것보다:

```text
createRectangle
createText
setPosition
setWidth
setHeight
```

Sketchy의 의미가 담긴 API를 제공해야 한다.

```text
createScreen

createFeature

connectScreens

getFlow
```

Figma의 저수준 Canvas 조작은 Figma MCP가 담당한다.

Sketchy는 제품의 의미 구조를 담당한다.

```text
Figma MCP
=
"어떻게 그릴 것인가"


Sketchy MCP
=
"무엇을 왜 그릴 것인가"
```

---

# 18. Sketchy의 One Source of Truth

Sketchy의 핵심 원칙은 유지한다.

```text
Screen
   ↓
Feature
   ↓
Connection
```

여기에서:

```text
Prototype
Flow
Spec
Wireframe
```

등을 파생한다.

AI를 도입한다고 별도의 AI 전용 데이터 모델을 만들지 않는다.

```text
사람
     \
      → Sketchy Data → Flow
     /               → Prototype
AI                  → Spec
                     → Wireframe
```

사람이 Plugin UI에서 Screen을 만들든 AI가 MCP를 통해 Screen을 만들든 **동일한 Sketchy 데이터가 생성되어야 한다.**

---

# 19. 장기적인 방향

초기에는:

```text
Claude / Codex

├─ Figma MCP
└─ Sketchy MCP
```

두 개를 연결하는 방식으로 시작할 수 있다.

장기적으로는 설치와 설정 과정을 단순화하는 방향도 고려할 수 있다.

```text
Claude / Codex
      ↓
   Sketchy
      ↓
 ┌─────────────┐
 │ Sketchy Core │
 └─────────────┘
      ↓
 Figma Integration
```

사용자 입장에서는 가능하면:

```text
"Sketchy를 연결한다."
```

정도로 느껴지는 것이 이상적이다.

내부적으로 어떤 MCP나 Figma 연동을 사용하는지는 제품이 처리한다.

---

# 20. 최종 제품 경험

최종적으로 만들고 싶은 경험은 다음과 같다.

사용자:

```text
"중고거래 앱 만들어줘.

홈에서 상품을 선택하면 상세로 이동하고,
상세에서는 찜하거나 채팅을 시작할 수 있어.

판매자는 상품 등록 화면에서
사진, 가격, 설명을 입력할 수 있어."
```

AI:

```text
요구사항 분석
      ↓
Sketchy Screen 생성
      ↓
Sketchy Feature 생성
      ↓
Connection 생성
      ↓
Flow 생성
      ↓
Figma Wireframe 생성
      ↓
Sketchy ↔ Figma Node Mapping
```

결과:

```text
Figma Canvas
+
Screen 구조
+
Feature 정의
+
Connection
+
User Flow
+
Prototype 정보
+
Spec
```

가 하나의 데이터에서 만들어진다.

---

# 결론

Sketchy를 단순한 Figma 와이어프레임 플러그인으로 한정하지 않는다.

핵심 구조는:

```text
                 Sketchy Core

          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼

    Figma Plugin           Sketchy MCP
          │                     │
          ▼                     ▼

        사람                AI Agent
                            Claude
                            Codex

                                  │
                                  ▼

                              Figma MCP
                                  │
                                  ▼
                             Figma Canvas
```

이다.

Sketchy MCP는 AI가 Sketchy 내부 소스코드를 직접 읽게 만드는 것이 아니다.

**Sketchy의 제품 설계 능력을 MCP Tool이라는 명시적인 인터페이스로 AI에게 제공하는 계층**이다.

이를 통해 Sketchy는:

> **사람과 AI가 동일한 Screen / Feature / Connection 모델을 사용해 제품을 설계하고, 그 결과를 Figma의 Flow / Prototype / Spec / Wireframe으로 파생시키는 시스템**

으로 확장할 수 있다.

---

# 실행 결정: Source of Truth와 MCP v1

Core를 공유하는 것과 상태를 공유하는 것은 다르다. 현재 Sketchy Project는
Figma 문서의 `figma.root.getPluginData("sketchy:project")`에 있으므로 별도
프로세스인 MCP Server가 같은 Core를 import해도 현재 문서 상태에 접근할 수
없다.

실제 쓰기 가능한 MCP를 시작할 때는 revision을 가진 Sketchy API Project를
원본으로 삼는다.

```text
                 Sketchy API
               Project + Revision
                  /          \
          Figma Plugin     Sketchy MCP
                |
            Figma Canvas
```

원칙:

- Sketchy UI와 MCP 변경은 모두 Sketchy API를 통한다.
- Sketchy Model이 의미의 원본이고 Figma Canvas는 Projection이다.
- Plugin이 닫힌 동안의 Canvas 직접 변경은 다음 실행 또는 Agent 작업 전에
  비교한다.
- 외부 변경은 자동 역동기화하거나 덮어쓰지 않고 `Canvas 변경 유지` 또는
  `Sketchy로 복원`을 사용자가 선택한다.
- Canvas → Sketchy 변환은 별도의 명시적인 Import/Adopt 기능으로 다룬다.

MCP v1은 개별 CRUD Tool을 나열하는 대신 원자적인 Batch 변경을 사용한다.

```text
get_project
get_screen
preview_project_changes
apply_project_changes
```

```json
{
  "projectId": "project-commerce",
  "baseRevision": 12,
  "idempotencyKey": "request-123",
  "changes": []
}
```

변경은 Preview → Validation → 사용자 승인 → Apply → Figma Projection →
재검증 순서로 처리한다. revision 충돌, 중복 ID, 존재하지 않는 대상과
Destination 참조를 Apply 전에 거절한다.

Feature는 Element의 Trigger와 Action을 원본으로 유지한다. Agent가 사용하는
변경 언어는 `SET_ELEMENT_ACTION`, `ADD_ELEMENT_CASE`처럼 Element 중심으로
표현할 수 있다. Connection은 `Feature.action.destinationScreenId`에서
파생하므로 별도 `connect_screens` mutation을 두지 않는다.
