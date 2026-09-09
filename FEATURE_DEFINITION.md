# Sketchy — Feature 정의

여러 에이전트와 나눈 논의를 종합한 최종 정리본이다.

## 한 줄 정의

> **Feature = 이 화면에서 사용자가 할 수 있는 의미 있는 기능 하나.**
> Element는 그 기능을 발생시키는 Trigger이고, Action은 기능이 실행된 결과다.

```
Element
   │ trigger
   ▼
Feature  (기획 의도 / 이름 / 설명)
   │ action
   ▼
Screen 이동 / State 변경 / Modal 열기 / 메시지 표시 ...
```

## 왜 이렇게 나눠야 하는가

기존 코드는 `Button → destinationScreenId`가 직접 연결되어 있었다. 이 구조의 문제:

1. **destination이 필수값이라, 화면 이동이 없는 기능은 아예 저장이 안 된다.**
   예: 찜하기, 저장, 나가기 확인 팝업, 조건부 UI 변경 — 전부 Feature로 표현 불가능했음.
2. Feature 이름이 Element 이름에 종속돼 있어, "기능을 먼저 정의하고 나중에 요소에 연결"하는 흐름(§9 Mental Model)을 지원할 수 없었음.
3. 버튼 하나가 표현할 수 있는 결과가 "화면 이동" 하나뿐이라, Sketchy가 원래 잡으려던 기획 의도(Feature)를 담을 그릇이 없었음.

**핵심 원칙**: 화면 이동은 Feature가 만들어낼 수 있는 여러 Action 중 하나일 뿐이다.

## 타입 설계

```ts
type Trigger =
  | { type: "click"; elementId: string }
  | { type: "change"; elementId: string }
  | { type: "submit"; elementId?: string };

type Action =
  | { type: "navigate"; destinationScreenId?: string }
  | { type: "set-state"; stateId: string; value: boolean };

interface Feature {
  id: string;
  screenId: string;
  name: string;
  trigger?: Trigger;
  action: Action;
  description?: string;
}
```

`destinationScreenId`는 `navigate` Action에만 속하며 나중에 연결할 수 있다. `back`, `open-modal`, `show-message` 등은 해당 Block과 표현 방식이 추가될 때 Action 유니온을 확장한다.

## 예시로 검증

| Feature     | Trigger        | Action       | Destination |
| ----------- | -------------- | ------------ | ----------- |
| 구매하기    | click          | navigate     | 주문서 화면 |
| 찜하기      | click          | update-state | 없음        |
| 상품 옵션   | click          | open-modal   | 없음        |
| 로그인      | submit         | navigate     | Home 화면   |
| 저장        | submit         | update-state | 없음        |
| 나가기 확인 | click (백버튼) | show-message | 없음        |
| 성별 선택   | change         | update-state | 없음        |

"인풋 입력"처럼 그 자체로 결과를 만들지 않는 요소는 Feature가 아니라, Feature가 발생하기 위한 **전제조건(Element의 존재)** 일 뿐이다. 예: 로그인 Feature = `submit 버튼 클릭 → Home 이동`. 이메일/비밀번호 Input은 Feature를 발생시키지 않는다.

## Feature와 Screen State의 관계 — 소유가 아니라 참조

State는 Feature 밑에 속하지 않는다. **State는 Screen에 한 번만 정의되고, 여러 Feature가 그 State를 참조(변경)할 뿐이다.**

```
Screen
 ├─ States (flat list, Screen에 한 번만 정의)
 │    ├─ default
 │    ├─ loading
 │    ├─ empty
 │    └─ error
 │
 └─ Features
      ├─ 새로고침 → Action: update-state → loading
      ├─ 재시도   → Action: update-state → loading
      └─ 검색     → Action: update-state → empty | default
```

이유: 같은 `loading` State를 "새로고침"과 "재시도" Feature가 동시에 만들어낼 수 있다. State를 Feature 하위 개념으로 두면 같은 State를 여러 Feature 밑에 중복 정의해야 하고, 이는 Sketchy의 **One Source of Truth** 원칙과 정면으로 충돌한다.

> Feature → State를 만든다 ❌
> Feature → State를 변경한다 ⭕

## Feature를 발생시킬 수 있는 요소

지금(v0)은 Button(`click`)뿐이지만, Block이 확장되면 다음 순서로 늘어날 것:

1. **Button** — `click` (구현됨)
2. **List Item / Card / Table Row** — `click` (목록 → 상세 이동 패턴, 실무에서 매우 흔함)
3. **Tabs / Navigation** — `click`
4. **Select / Checkbox / Radio / Switch** — `change`
5. **Input(폼 전체) / Search** — `submit`

블록이 없는 트리거를 먼저 설계할 필요는 없다 — Block이 추가될 때 같이 확장한다.

## UI 표현 — Feature라는 단어를 사용자에게 노출하지 않는다

Sketchy의 Low Friction / Progressive Complexity 철학상, 사용자는 Feature라는 개념 자체를 몰라도 된다. 내부적으로만 Feature/Trigger/Action으로 저장한다.

```
[버튼 선택]

구매하기
On click
[ Go to screen ▼ ]
  [ 주문서 ▼ ]
```

```
찜하기
On click
[ Change state ▼ ]
[ When clicked                 ]
[ 상품을 찜 목록에 추가한다    ]
```

```
상품 옵션
On click
[ Open ▼ ]
  [ 옵션 Modal ▼ ]
```

## 진입점 — Element 우선과 Screen 우선을 동시 지원

두 경로가 **동일한 Feature 객체**를 만들고 참조해야 한다.

- **Element 우선** (기존 흐름 유지): 버튼 선택 → 패널에서 Trigger/Action 지정 → 내부적으로 Feature 자동 생성
- **Screen 우선** (신규): Screen Details 접이식 섹션에 "+ 기능 추가" → 이름/Action만 먼저 정의 → Element 연결은 나중(`Link element`)

Feature의 부모는 Screen이고, Element는 **Optional 자식**이라는 데이터 모델(Screen → Feature → Element?)을 그대로 반영한 구조다.

## 남은 위험 요소 (구현 시 주의)

- **Orphan Feature**: Element 연결이 없거나, 연결된 Element가 캔버스에서 삭제된 Feature도 Spec/Flow에는 보존한다. 실제 Figma Prototype은 목적지가 연결된 `navigate`만 생성한다.
- **1 Feature = 1 Action** 원칙을 당분간 유지한다. 여러 Action(성공/실패 분기 등)이 필요해지면 §11 Condition으로 확장하되, 처음부터 `actions[]` 배열을 허용해 Workflow Engine처럼 복잡해지지 않도록 주의한다.

## 현재 상황

현재 코드는 Feature를 Screen 소유 데이터로 저장하고 다음 두 Action을 지원한다.

```ts
type Action =
  | { type: "navigate"; destinationScreenId?: string }
  | { type: "set-state"; stateId: string; value: boolean };
```

- `navigate`: 목적 화면이 연결되면 Figma Prototype reaction을 생성한다.
- `set-state`: 사용자가 작성한 자연어 행동을 캔버스 메모, Flow, Spec에 같은 데이터로 표시한다.
- Figma 유료 플랜에 의존하는 Variable/Conditional Prototype은 사용하지 않는다.
- Spec은 실제 Canvas 위치를 기준으로 Element를 위→아래, 같은 줄은 왼쪽→오른쪽 순으로 표시한다.

따라서 화면 이동 기능은 실행 가능한 Prototype으로, 화면 이동 없는 기능은 모든 이해관계자가 클릭 없이 읽을 수 있는 정적 행동 명세로 전달한다.
