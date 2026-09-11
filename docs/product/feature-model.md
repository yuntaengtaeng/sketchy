# 기능 모델

Feature, Trigger, Action의 현재 정의와 Interaction UI의 구현 원칙을 설명한다.

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
2. 화면 이동과 비시각 결과를 같은 데이터로 보존할 수 없어 Canvas, Flow, Spec의 설명이 달라졌음.
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
  | { type: "overlay"; destinationScreenId?: string }
  | { type: "close-overlay" }
  | { type: "describe" };

interface Feature {
  id: string;
  screenId: string;
  name: string;
  trigger?: Trigger;
  action: Action;
  condition?: string;
  description?: string;
}
```

`destinationScreenId`는 `navigate`와 `overlay`에만 속한다. 같은 Trigger를 참조하는 첫 Feature가 기본 Case이고 이후 Feature는 `condition`을 가진 조건 Case다.

## 예시로 검증

| Feature      | Trigger | Action        | Destination    |
| ------------ | ------- | ------------- | -------------- |
| 구매하기     | click   | navigate      | 주문서 화면    |
| 상품 옵션    | click   | overlay       | 상품 옵션 상태 |
| Popup 닫기   | click   | close-overlay | 없음           |
| 찜하기       | click   | describe      | 없음           |
| 입력 오류 시 | click   | overlay       | 오류 Popup     |

"인풋 입력"처럼 그 자체로 결과를 만들지 않는 요소는 Feature가 아니라, Feature가 발생하기 위한 **전제조건(Element의 존재)** 일 뿐이다. 예: 로그인 Feature = `submit 버튼 클릭 → Home 이동`. 이메일/비밀번호 Input은 Feature를 발생시키지 않는다.

## Feature와 Screen State의 관계

State는 별도 상태 엔진이 아니라 원본 Screen을 복제한 파생 Screen이다. `baseScreenId`가 원본을 가리키며 Feature의 Action은 이 상태를 목적지로 참조한다. Popup 상태에는 원본 화면, Dim, 편집 가능한 Popup Section이 함께 있어 Flow와 Spec이 실제 시각 결과를 공유한다.

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
[ Stay on screen ]
[ 상품을 찜 목록에 추가한다 ]
```

```
상품 옵션
[ Open popup ]
  [ 상품 옵션 상태 ▼ ]
```

## 진입점 — Element 우선

Button을 선택하고 결과를 고르면 내부 Feature가 자동 생성된다. 별도 기능 관리 화면이나 나중에 Element를 연결하는 Screen-first 흐름은 만들지 않는다.

## 남은 위험 요소 (구현 시 주의)

- Element나 Screen이 삭제되면 연결된 Feature와 Figma reaction도 함께 제거한다.
- 한 Case는 하나의 Action만 가진다. 성공/실패는 같은 Trigger를 참조하는 Case로 나누며 `actions[]` 워크플로 엔진은 만들지 않는다.

## 현재 상황

현재 코드는 Feature를 Screen 소유 데이터로 저장하고 다음 Action을 지원한다.

```ts
type Action =
  | { type: "navigate"; destinationScreenId?: string }
  | { type: "overlay"; destinationScreenId?: string }
  | { type: "close-overlay" }
  | { type: "describe" };
```

- `navigate`: 일반 Screen으로 이동하는 Figma Prototype을 만든다.
- `overlay`: 같은 원본 Screen의 Popup 파생 상태를 여는 Figma Prototype을 만든다.
- `close-overlay`: Popup 내부에서 실제 Figma Close action을 만든다.
- `describe`: 화면 이동 없는 결과를 Flow와 Spec에 표시한다.
- Figma 유료 플랜에 의존하는 Variable/Conditional Prototype은 사용하지 않는다.
- Spec은 실제 Canvas 위치를 기준으로 Element를 위→아래, 같은 줄은 왼쪽→오른쪽 순으로 표시한다.

따라서 기본 Case의 Navigate, Open popup, Close popup은 실행 가능한 Prototype으로 만들고, 조건 Case와 화면 이동 없는 결과는 모든 이해관계자가 클릭 없이 읽을 수 있는 Flow와 Spec으로 전달한다.

## Interaction UI 원칙

Sketchy의 목표는 사용법을 읽게 하는 것이 아니라, 가장 적은 판단으로 화면·Flow·기능 명세를 함께 만드는 것이다.

- 컨트롤의 이름은 설명이 아니라 사용자가 얻을 결과를 말한다. 설명 문구가 계속 필요하면 문구를 추가하지 않고 동작이나 이름을 다시 설계한다.
- 고정된 소수의 배타적 선택은 Radio 또는 Segmented selector, 개수가 늘어나는 대상 목록은 Select, 독립적인 켜기/끄기는 Checkbox 또는 Switch를 사용한다.
- 한 Case는 대표 시각 결과 하나를 가진다. 일반 Screen에서는 `Go to screen`, `Open popup`, `Stay on screen` 중 하나이며 Popup 내부에서는 중첩 Popup 대신 `Go to screen`, `Close popup`, `Stay on screen` 중 하나다. 같은 버튼의 조건 분기는 Case를 추가해 표현하되 범용 `actions[]` 워크플로 엔진으로 확장하지 않는다.
- 첫 Case는 `Default · prototype`, 추가 Case는 `Case · flow`로 구분하고 `When` 조건과 함께 Flow와 Spec에 표시한다. 조건부 연결선은 점선으로 그리며 Figma가 판정할 수 없는 조건을 실행되는 것처럼 가장하지 않는다.
- 저장·요청처럼 대표 결과와 함께 일어나는 비시각 부수효과는 각 Case의 `Also happens`에 적는다.
- 기본 Case에서 실행 행동으로 노출한 선택지는 실제 Figma Prototype을 만든다. 실행할 수 없는 조건 Case에는 실행되는 것처럼 보이는 이름을 붙이지 않는다.
- Popup은 원본 Screen을 복제한 파생 상태(`baseScreenId`)에 Dim과 Popup을 얹고 실제 Overlay로 연결한다. 화면 이동과 혼동하지 않도록 Flow에서는 중립 회색 점선을 사용한다. Plugin API로 위치를 보장할 수 없는 Snackbar는 실행 선택지로 노출하지 않는다.
- Popup Destination은 같은 원본 Screen에서 파생된 상태로 제한한다. Popup 내부 버튼은 Figma의 실제 `CLOSE` 액션을 사용하며 중첩 Popup을 만들지 않는다.
- 실제 데이터를 삭제하는 동작만 확인을 요구하고 원본 Screen 삭제 시 함께 제거되는 파생 상태와 incoming 연결 수를 알린다. 일반적인 선택, 생성, 연결, 액션 교체에는 확인창이나 별도 설정 화면을 두지 않는다.
