# Sketchy

> **Keep your wireframes sketchy.**\
> 기획자가 디자인에 시간을 쓰지 않고, 화면의 **구조 · 동작 · 흐름 · 기능
> 명세**를 빠르게 표현할 수 있도록 돕는 Figma 플러그인.

------------------------------------------------------------------------

## 1. Product Vision

Sketchy는 "예쁜 와이어프레임을 만드는 도구"가 아니다.

기획 단계에서 필요한 것은 완성된 UI가 아니라 다음 네 가지다.

1.  화면에 무엇이 있는가
2.  사용자가 무엇을 할 수 있는가
3.  행동하면 어디로 이동하는가
4.  각 요소는 어떻게 동작하는가

Sketchy는 이 정보를 한 번만 작성하고 여러 형태로 재사용할 수 있게 한다.

``` text
Wireframe
    ↓
Interaction
    ↓
Flow
    ↓
Spec
```

### 핵심 원칙

> **Design less. Explain better.**

기획자는 구조와 동작을 정의한다.\
시각 디자인은 디자이너의 영역으로 남긴다.

------------------------------------------------------------------------

# 2. Product Hypothesis & Constraint

## Low-fi is a constraint, not a hypothesis

Sketchy는 **기획자가 Low-fi UI를 선호할 것**이라고 가정하지 않는다.

Low-fi는 기획 단계에서 시각 디자인에 소비되는 비용을 제한하고, 사용자가
화면의 **구조 · 기능 · 흐름**에 집중하도록 만들기 위한 제품적 제약이다.

따라서 Sketchy가 검증해야 하는 질문은 다음이 아니다.

``` text
기획자는 Low-fi를 좋아하는가?
```

Sketchy가 실제로 검증해야 하는 것은 다음이다.

``` text
화면을 만들면서
기능과 화면 연결을 함께 정의하는 방식이

기존의
화면 작성 + 화살표 + 별도 기능 설명 + 별도 명세

방식보다 빠르고 명확한가?
```

Sketchy의 핵심 가설:

> **Screen → Feature → Connection으로 입력한 정보가 Flow와 Spec으로 자동
> 파생될 때, 기획자의 반복 작업과 전달 비용을 줄일 수 있다.**

검증 대상:

-   화면 구조를 빠르게 표현할 수 있는가
-   화면에서 가능한 기능을 자연스럽게 작성할 수 있는가
-   화면 간 이동을 쉽게 정의할 수 있는가
-   동일한 기능/연결 정보를 반복해서 작성하지 않아도 되는가
-   생성된 Flow와 Spec을 디자이너와 개발자가 쉽게 이해할 수 있는가
-   `Screen → Feature → Connection → Flow / Spec` Mental Model이 실제
    업무에서 자연스러운가

Low-fi의 시각적 선호도 자체는 핵심 가설로 취급하지 않는다.

사용자가 더 높은 시각적 완성도를 요구하더라도 이를 곧바로 제품 가설의
실패로 해석하지 않는다. 해당 요구는 Sketchy가 허용할 표현 범위와 제품
경계의 문제로 판단한다.

Sketchy는 이러한 요구를 무제한으로 수용하여 Mini Figma가 되는 것을
지양한다.

------------------------------------------------------------------------

# 3. Problem

현재 기획자가 Figma에서 화면을 설명할 때 흔히 다음 방식이 사용된다.

### Case A --- 디자인까지 만들어버림

기획자가 색상, 아이콘, 이미지, 실제 컴포넌트 등을 사용해 거의 완성된
UI를 만든다.

문제:

-   기획 단계에서 불필요한 디자인 시간이 발생한다.
-   디자이너의 탐색 범위를 제한할 수 있다.
-   기획 의도와 시각 디자인이 섞인다.
-   디자인 변경 시 기획 문서도 다시 수정해야 한다.

### Case B --- Screenshot 기반 기획

기존 서비스나 현재 제품 화면을 캡처하고 화살표와 텍스트를 붙인다.

문제:

-   화면 구조 수정이 어렵다.
-   Flow가 커질수록 관리하기 어렵다.
-   Screenshot과 실제 기능 명세가 분리된다.
-   어떤 요소가 실제 인터랙션 대상인지 알기 어렵다.

### Case C --- 화면과 명세가 따로 존재

``` text
Figma
→ 화면

Notion / Docs
→ 기능 명세

Figma Prototype
→ 화면 이동

FigJam
→ User Flow
```

같은 정보를 여러 곳에서 반복해서 관리한다.

Sketchy는 이것을 하나로 합친다.

------------------------------------------------------------------------

# 4. Target User

## Primary

서비스 / 프로덕트 기획자, PM, PO

특히 다음과 같은 사용자:

-   Figma를 전문 디자인 도구 수준으로 사용할 필요는 없는 사람
-   빠르게 화면 구조를 표현하고 싶은 사람
-   개발자/디자이너에게 동작을 명확하게 전달해야 하는 사람
-   화면 Flow와 기능 명세를 함께 관리하고 싶은 사람

## Secondary

-   UX Designer
-   Product Designer
-   Developer
-   초기 스타트업 팀

------------------------------------------------------------------------

# 5. Core Concept

Sketchy의 데이터 구조는 다음 관계를 중심으로 한다.

``` text
Project
 ├── Screen
 │    ├── Element
 │    │    └── Interaction
 │    └── Screen Spec
 │
 └── Flow
      └── Screen → Interaction → Screen
```

하나의 Interaction을 정의하면 이를 여러 곳에서 재사용한다.

``` text
"구매하기" Button
       ↓
Click
       ↓
주문서 Screen
```

이 정보 하나로:

-   Figma Prototype
-   Flow Map
-   기능 명세
-   Present Mode

를 생성한다.

------------------------------------------------------------------------

# 6. Product Modes

Sketchy는 크게 세 가지 모드로 구성한다.

``` text
BUILD
  ↓
FLOW
  ↓
PRESENT
```

------------------------------------------------------------------------

# 7. Build Mode

기획자가 Low-fi Wireframe을 만드는 영역.

## 6.1 Wireframe Blocks

기본 제공 블록:

### Basic

-   Text
-   Button
-   Icon Placeholder
-   Image Placeholder
-   Divider
-   Badge

### Input

-   Text Input
-   Textarea
-   Checkbox
-   Radio
-   Switch
-   Select
-   Search

### Navigation

-   Header
-   Tabs
-   Bottom Navigation
-   Sidebar
-   Breadcrumb

### Content

-   List
-   List Item
-   Card
-   Table
-   Table Row
-   Pagination
-   Accordion

### Feedback

-   Alert
-   Toast
-   Modal
-   Bottom Sheet
-   Empty State
-   Loading
-   Error State

------------------------------------------------------------------------

## 6.2 Intentionally Low-fi

Sketchy 컴포넌트는 의도적으로 디자인 기능을 제한한다.

지원하지 않거나 최소화할 것:

-   자유로운 Color Picker
-   Gradient
-   Shadow
-   Decorative Border
-   Custom Font
-   실제 서비스 Icon Set
-   복잡한 visual styling

기본 스타일은 neutral wireframe 스타일을 사용한다.

목적:

> 기획자가 디자인하는 것을 방지하고 구조에 집중하게 한다.

------------------------------------------------------------------------

# 8. Block Picker

Sketchy는 명령어를 외우는 방식보다 **보고 선택하는 방식**을 기본
인터랙션으로 사용한다.

기획자가 Figma나 개발 도구에 익숙하지 않아도 사용할 수 있도록 한다.

기본 흐름:

``` text
Select
  ↓
Configure
  ↓
Insert
```

플러그인 패널에서는 Wireframe Block을 카테고리별로 보여준다.

``` text
Add something

Basic
[ Text ] [ Button ] [ Image ]

Form
[ Input ] [ Select ] [ Checkbox ]

Content
[ List ] [ Table ] [ Card ]

Navigation
[ Header ] [ Tabs ] [ Bottom Nav ]

Overlay
[ Modal ] [ Bottom Sheet ]
```

Block을 선택하면 필요한 옵션만 설정한다.

예:

``` text
Add Table

Columns
[ 4 ]

Rows
[ 5 ]

☑ Header
☑ Pagination

[ Add ]
```

List:

``` text
Add List

Items
[ 5 ]

Item contains

☑ Image
☑ Title
☑ Description
☐ Action

[ Add ]
```

Sketchy Screen 내부에서도 Block 사이의 `+` 버튼을 통해 해당 위치에
새로운 Block을 삽입할 수 있도록 고려한다.

Command Palette나 `/table`, `/button` 등의 shorthand는 MVP에서 제외한다.

향후 숙련 사용자를 위한 Power User 기능으로 추가할 수 있다.

------------------------------------------------------------------------

# 9. Screen Details

Sketchy의 중심 객체는 Element가 아니라 **Screen**이다.

기획자는 특정 Button의 속성을 정의하는 것부터 시작하지 않는다.

대신:

``` text
화면을 만든다
   ↓
이 화면에서 가능한 기능을 정의한다
   ↓
필요하면 화면 요소와 연결한다
   ↓
다른 화면과 연결한다
```

라는 Mental Model을 따른다.

Screen을 선택하면 Sketchy 패널에서 해당 화면의 정보를 편집한다.

예:

``` text
상품 상세
────────────────────────

화면 설명
상품 정보를 확인하고 구매할 수 있는 화면

진입
• 상품 목록에서 상품 선택
• 검색 결과에서 상품 선택

기능

[ 구매하기 ]
주문서 화면으로 이동 →

[ 찜하기 ]
상품을 찜 목록에 추가

[ 상품 옵션 ]
옵션 선택창 표시

+ 기능 추가
```

------------------------------------------------------------------------

# 10. Screen Feature

화면에서 수행할 수 있는 행동을 **Feature(기능)** 단위로 관리한다.

기능 추가의 기본 UI는 단순해야 한다.

``` text
기능 추가

기능 이름
[ 구매하기 ]

화면에서 연결
[ 요소 선택하기 ]

동작
[ 화면 이동 ▼ ]

이동할 화면
[ 주문서 ▼ ]

설명 (선택)
[                  ]

[ 추가 ]
```

`화면에서 연결`은 선택 사항이다.

기획자는 기능을 먼저 정의하고, 필요할 때 해당 기능이 어느 UI 요소에서
발생하는지 연결할 수 있다.

따라서 Element는 기획의 중심 객체가 아니라 **기능과 실제 Wireframe
위치를 연결하는 수단**이다.

``` text
Screen
  │
  ├─ Feature
  │    ├─ Element (optional)
  │    └─ Destination
  │
  └─ Feature
```

초기 지원 동작:

-   다른 화면으로 이동
-   이전 화면으로 이동
-   Modal 표시
-   Bottom Sheet 표시
-   메시지 표시
-   상태 변경
-   외부 링크
-   기타

------------------------------------------------------------------------

# 11. Conditions

조건은 기본 입력으로 강제하지 않는다.

필요한 Feature에서만 `+ 조건 추가`를 통해 확장한다.

예:

``` text
구매하기

기본
→ 주문서

+ 조건 추가

필수 옵션 미선택
→ "옵션을 선택해주세요."

품절
→ 구매 불가
```

Sketchy는 단순한 기획에서는 단순하게 사용할 수 있어야 한다.

복잡한 기능에서만 조건, 예외 등의 추가 정보를 노출한다.

------------------------------------------------------------------------

# 12. Screen Spec

Screen Details에 입력한 정보 자체가 기능 명세의 원본 데이터가 된다.

별도의 기능 명세서를 처음부터 다시 작성하지 않는다.

예:

``` text
상품 상세

화면 설명
상품 정보를 확인하고 구매할 수 있다.

진입
- 상품 목록
- 검색 결과

기능

1. 구매하기
   - 주문서 화면으로 이동
   - 연결 요소: 구매하기 버튼

2. 찜하기
   - 상품을 찜 목록에 추가

3. 상품 옵션
   - 옵션 선택창을 표시
```

기능에서 이미 정의한 Destination이나 조건은 Spec에 자동으로 반영한다.

핵심 원칙:

> **화면에 기능을 작성하면 명세가 된다.**

동일한 정보를 Flow와 Spec에서 다시 입력하지 않는다.

------------------------------------------------------------------------

# 13. Flow Mode

Sketchy의 주요 차별화 기능.

선택한 Screen 또는 Flow를 Fullscreen 형태로 시각화한다.

예:

``` text
                    상품 목록
                        │
                     상품 선택
                        │
                        ▼
                    상품 상세
                    /       \
                 구매        찜
                  │          │
                  ▼          ▼
                주문서     로그인?
                  │         /    \
                  │       YES    NO
                  │        │      │
                  ▼        ▼      ▼
                 결제     찜완료  로그인
                  │
                  ▼
                완료
```

------------------------------------------------------------------------

# 14. Flow Node

각 Screen은 Flow에서 Node로 표시한다.

Node에는 최소 정보만 표시한다.

``` text
┌──────────────────┐
│ 상품 상세         │
│                  │
│ [wireframe]      │
│                  │
│ 3 interactions   │
└──────────────────┘
```

Node 선택 시 상세 패널을 표시한다.

``` text
상품 상세

Purpose
상품 정보를 확인하고 구매한다.

Entry
상품 목록 → 상품 선택

Actions

구매하기 → 주문서
찜하기 → 찜
뒤로가기 → Previous
```

------------------------------------------------------------------------

# 15. Connection Detail

Flow의 연결선을 선택하면 Interaction 정보를 표시한다.

``` text
구매하기

Trigger
Click

Condition
필수 옵션 선택 완료

Destination
주문서

Otherwise
옵션 선택 Alert
```

------------------------------------------------------------------------

# 16. Flow Filtering

대규모 서비스의 Flow가 복잡해지는 것을 방지한다.

지원 후보:

``` text
Show

● Current Flow
○ From this screen
○ To this screen
○ All connected screens
```

조건별 필터:

``` text
☑ Main Flow
☑ Alternative
☐ Error
☐ Edge Case
```

------------------------------------------------------------------------

# 17. Present Mode --- Post-v0

회의 / 리뷰용 모드.

Flow Map 대신 하나의 Screen에 집중한다.

``` text
┌────────────────────────────┐
│                            │
│        Wireframe           │
│                            │
│       [ 구매하기 ]          │
│                            │
└────────────────────────────┘

구매하기

Click
→ 주문서
```

인터랙션 요소를 클릭하면 정의된 Flow에 따라 다음 Screen으로 이동한다.

즉 Sketchy에서 작성한 기획을 실제로 따라가 볼 수 있다.

------------------------------------------------------------------------

# 18. Spec View

프로젝트 또는 특정 Flow의 기능 명세를 자동으로 구성한다.

예:

``` text
# 상품 상세

## Purpose

상품 정보를 확인하고 구매한다.

## Entry

상품 목록 → 상품 선택

## States

- Default
- Loading
- Sold Out
- Error

## Interactions

### 구매하기

Trigger
Click

Condition
필수 옵션 선택 완료

Destination
주문서

Otherwise
옵션 선택 Alert

### 찜하기

Trigger
Click

Condition
로그인 상태

Destination
찜 완료
```

------------------------------------------------------------------------

# 19. Spec Export

초기 후보:

-   Markdown
-   Plain Text

향후:

-   CSV
-   PDF
-   JSON

JSON Export는 다른 도구와 연동할 수 있도록 내부 데이터 구조와 최대한
일치시킨다.

예:

``` json
{
  "screen": {
    "id": "product-detail",
    "name": "상품 상세",
    "purpose": "상품 정보를 확인하고 구매한다.",
    "states": [
      "default",
      "loading",
      "sold-out",
      "error"
    ],
    "elements": [
      {
        "id": "purchase-button",
        "name": "구매하기",
        "type": "button",
        "interaction": {
          "trigger": "click",
          "action": "navigate",
          "destination": "checkout"
        }
      }
    ]
  }
}
```

------------------------------------------------------------------------

# 20. Make it Sketchy --- Post-MVP

`Make it Sketchy`는 **MVP에 포함하지 않는다.**

Sketchy의 핵심인 Wireframe → Screen Feature → Flow → Spec 경험을 먼저
검증한 이후 Import 기능으로 고려한다.

목적:

> 기존 UI의 디자인을 가져오는 것이 아니라 **구조만 Sketchy 형태로
> 가져온다.**

## 19.1 Existing Figma UI → Sketchy

우선순위가 더 높은 Import 방식이다.

기존 Figma Frame을 선택하고:

``` text
Existing Figma UI
        ↓
  Make it Sketchy
        ↓
Low-fi Sketchy Screen
```

Figma Node 구조를 분석하여 가능한 요소를 Sketchy Block으로 변환한다.

제거:

-   Color
-   Shadow
-   Brand styling
-   Decorative border
-   Typography styling
-   실제 이미지 표현

유지:

-   Layout
-   Text
-   Content hierarchy
-   주요 UI 요소
-   화면 구조

Figma Node, Component/Instance 이름, Layout 정보 등을 활용한다.

의미를 확실하게 판단할 수 없는 요소는 임의로 복잡한 UI를 생성하지 않고
Generic Block으로 처리하거나 사용자에게 확인할 수 있도록 한다.

## 19.2 Screenshot → Sketchy

Screenshot 변환은 더 후순위 기능으로 둔다.

일반 이미지에는 Figma Node 구조가 없기 때문에 Plugin API만으로 Button,
Input, List 등의 의미를 안정적으로 파악하기 어렵다.

필요한 경우 Vision 모델을 이용하여:

``` text
Screenshot
    ↓
Vision Analysis
    ↓
Sketchy Schema
    ↓
Figma Nodes
```

형태로 처리한다.

Vision 모델이 직접 Figma 디자인을 생성하게 하지 않는다.

대신 제한된 Sketchy Schema만 생성하도록 한다.

개념 예:

``` json
{
  "type": "screen",
  "children": [
    { "type": "header", "text": "Store" },
    { "type": "image-placeholder" },
    { "type": "text", "text": "상품명" },
    { "type": "select", "label": "옵션" },
    { "type": "button", "label": "주문하기" }
  ]
}
```

Sketchy Plugin은 이 Schema를 검증한 뒤 Sketchy Block으로 렌더링한다.

Screenshot 분석에는 외부 모델 호출, 비용, 보안/개인정보, 정확도 등의
추가 고려사항이 있으므로 Core Product가 검증되기 전에는 구현하지 않는다.

------------------------------------------------------------------------

# 21. UX Principles

## 20.1 Low Friction

기획자는 Figma 전문가가 아니어도 사용할 수 있어야 한다.

가능한 작업은 1\~3개의 액션 안에서 완료한다.

Sketchy는 진짜 단순한 스케치 도구다.

-   사용자는 마우스로 고르고 누르는 것만으로 작업을 진행할 수 있어야 한다.
-   이름, 크기, 배치, 연결 표현은 기본값만으로 충분해야 한다.
-   설정과 입력은 결과에 꼭 필요할 때만 보여준다.
-   완성된 디자인보다 구조와 흐름을 빠르게 만드는 데 집중한다.

## 20.2 One Source of Truth

동일한 정보를 여러 번 입력하지 않는다.

``` text
Interaction 정의

→ Flow
→ Prototype
→ Spec
→ Present
```

모두 동일 데이터를 사용한다.

## 20.3 Low-fi by Default

Sketchy가 생성하는 화면은 항상 Low-fi다.

예쁜 화면을 만드는 기능을 추가하는 것보다 빠르게 이해할 수 있는 화면을
만드는 것을 우선한다.

## 20.4 Visual First

긴 문서를 먼저 작성하도록 요구하지 않는다.

``` text
Draw
↓
Connect
↓
Describe
```

순서로 작업할 수 있어야 한다.

## 20.5 Progressive Complexity

처음 사용하는 사용자는:

``` text
Screen
Button
Connection
```

만 알아도 사용할 수 있어야 한다.

Condition, State, Exception 등의 고급 기능은 필요할 때만 노출한다.

------------------------------------------------------------------------

# 22. MVP --- v0 Vertical Slice

Sketchy v0의 목적은 많은 Wireframe 기능을 제공하는 것이 아니다.

다음 핵심 경험 하나를 끝까지 검증한다.

``` text
Screen 생성
    ↓
간단한 Block 배치
    ↓
화면 Feature 작성
    ↓
다른 Screen과 연결
    ↓
Flow + Spec 자동 생성
```

## v0에 포함

### Screen

-   Screen 생성
-   Screen 이름
-   화면 설명

### 최소 Block

-   Text
-   Button
-   Input

Table, List, Modal 등은 v0에서 제외한다.

### Feature

-   화면에 Feature 추가
-   Feature 이름
-   설명
-   다른 Screen으로 이동
-   필요 시 Button과 Feature 연결

### Flow

전체 프로젝트를 한 번에 시각화하지 않는다.

초기에는 선택한 Screen에서 시작하는 연결만 보여준다.

``` text
Flow from this screen
```

### Spec

Screen Details와 Feature 정보를 기반으로 최소 Spec을 자동 생성한다.

동일한 정보를 다시 작성하게 하지 않는다.

## v0에서 제외

다음 기능은 핵심 경험 검증 후 확장한다.

-   추가 Wireframe Blocks
-   복잡한 Condition / Exception
-   대규모 Flow 탐색
-   Present Mode
-   CSV / PDF / JSON Export
-   Make it Sketchy
-   Screenshot Vision 분석
-   High-fidelity 표현 기능
-   AI 기반 기능

## v0 성공 시나리오

``` text
[ Login ]

Email
[             ]

Password
[             ]

[ Login ]
    │
    │ 로그인
    ▼
[ Home ]
```

기획자가:

1.  Login과 Home Screen을 만든다.
2.  Login Screen에 Input과 Button을 배치한다.
3.  `로그인` Feature를 작성한다.
4.  해당 Feature를 Login Button과 연결한다.
5.  Destination으로 Home을 선택한다.

그러면 Sketchy가 동일한 데이터로:

``` text
Flow
Login ── 로그인 ──→ Home
```

과:

``` text
Spec

Login

화면 설명
사용자가 계정으로 로그인한다.

기능
- 로그인
  - Login Button
  - Home으로 이동
```

을 자동으로 구성한다.

> **같은 정보를 두 번 입력해야 한다면 v0의 개선 대상으로 간주한다.**

------------------------------------------------------------------------

# 23. Technical Spike Before Product Development

제품 기능 개발 전에 Figma Plugin API가 Sketchy의 핵심 모델을 지원하는지
작은 코드로 검증한다.

가장 먼저 확인할 것은 **Feature → Destination 관계를 실제 Figma
Prototype 연결로 안정적으로 생성할 수 있는가**이다.

최소 Spike:

``` text
Screen A
  │
Button
  │
  │ Sketchy에서 Destination 지정
  ▼
Screen B
```

검증 항목:

-   Plugin API를 통해 Prototype reaction을 생성할 수 있는가
-   Button → Screen navigation을 원하는 형태로 설정할 수 있는가
-   기존 Prototype 설정과 충돌할 때 어떻게 처리할 것인가
-   Node가 삭제/복제/이동되었을 때 Sketchy metadata를 어떻게 유지할
    것인가
-   Sketchy Connection과 Figma Prototype 중 어느 쪽을 Source of Truth로
    둘 것인가

기술 Spike가 실패하거나 제약이 크다면 Product UX를 구현에 맞춰 조정한다.

Block Picker와 전체 UI를 먼저 만드는 것보다 이 핵심 연결 가능성을 먼저
검증한다.

------------------------------------------------------------------------

# 24. Recommended Technical Architecture

Figma Plugin은 크게 두 영역으로 분리한다.

``` text
Figma Sandbox
      │
      │ postMessage
      ▼
Plugin UI
```

## Plugin Code

책임:

-   Figma Node 조회
-   Frame 생성
-   Component 생성
-   Auto Layout 설정
-   Prototype 설정
-   Plugin Data 저장
-   Selection 감지

## UI

책임:

-   Wireframe Library
-   Interaction Editor
-   Spec Editor
-   Flow Viewer
-   Present Mode

------------------------------------------------------------------------

# 25. Technical Stack

Sketchy의 기본 기술 스택은 다음과 같이 구성한다.

-   Figma Plugin API
-   React
-   TypeScript
-   Vite

## Architecture

React는 Sketchy의 **Plugin UI**를 담당한다.

실제 Figma Canvas 조작은 React에서 직접 수행하지 않고 Plugin Runtime을
통해 수행한다.

``` text
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

### Plugin UI --- React

책임:

-   Block Picker
-   Screen Details
-   Screen Feature 편집
-   Flow
-   Spec
-   Present Mode

### Plugin Runtime --- TypeScript

책임:

-   Figma Node 생성 / 수정
-   Selection 감지
-   Auto Layout 구성
-   Prototype 연결
-   Plugin Data 저장 / 조회
-   UI에서 전달받은 Command 실행

### Shared

Plugin UI와 Plugin Runtime 사이에서 공유하는 순수 TypeScript 영역이다.

책임:

-   Domain Types
-   UI ↔ Plugin Message Types
-   Constants
-   Validation

특히 UI와 Runtime 사이의 메시지는 명시적인 타입으로 관리한다.

``` ts
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

``` ts
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

``` ts
figma.ui.onmessage = (message: PluginMessage) => {
  if (message.type === "INSERT_BLOCK") {
    // Figma Plugin API를 사용하여 실제 Node 생성
  }
};
```

핵심 원칙:

> **React는 Sketchy UI를 만들고, Figma Plugin API는 Sketchy가 만드는
> 실제 Canvas를 다룬다.**

------------------------------------------------------------------------

# 26. Suggested Project Structure

``` text
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

------------------------------------------------------------------------

# 27. Domain Types

비즈니스 데이터는 가능한 Figma API와 분리한다.

``` ts
type Screen = {
  id: string;
  nodeId: string;
  name: string;
  purpose?: string;
  states: ScreenState[];
};

type ScreenState =
  | "default"
  | "loading"
  | "empty"
  | "error"
  | "disabled"
  | "custom";

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

type Trigger =
  | "click"
  | "change"
  | "submit"
  | "open"
  | "close";

type Action =
  | "navigate"
  | "back"
  | "open-modal"
  | "open-bottom-sheet"
  | "close"
  | "show-message"
  | "external-link";
```

------------------------------------------------------------------------

# 28. Metadata

Sketchy가 관리하는 Node에는 pluginData를 사용하여 식별 정보를 저장한다.

개념 예:

``` text
sketchy:type = screen
sketchy:id = screen-product-detail
```

Element:

``` text
sketchy:type = element
sketchy:id = purchase-button
sketchy:screen-id = screen-product-detail
```

내부 데이터의 ID와 Figma node.id를 분리한다.

Figma Node가 변경되더라도 Sketchy의 Domain Model이 Figma 구현에 지나치게
의존하지 않도록 한다.

------------------------------------------------------------------------

# 29. Non-goals

초기 Sketchy가 하지 않을 것:

-   High-fidelity UI 생성
-   완성된 디자인 시스템 제공
-   개발 코드 생성
-   CSS 생성
-   React Component 생성
-   디자인 평가
-   AI 기반 UI 디자인
-   Project Management
-   Jira 대체
-   Notion 대체

Sketchy의 역할은 명확하다.

> **Wireframe + Interaction + Flow + Spec**

------------------------------------------------------------------------

# 30. Success Criteria

Sketchy가 성공했다면 기획자는:

### Before

``` text
화면 그리기
→ 디자인 고민
→ 화살표 그리기
→ Prototype 설정
→ 기능 명세 작성
→ Flow 문서 작성
```

### After

``` text
화면 그리기
→ 동작 연결
→ 설명 추가

Done.
```

그리고 Sketchy가 자동으로:

``` text
Wireframe
Prototype
Flow
Spec
Presentation
```

을 만들어준다.

------------------------------------------------------------------------

# 31. Brand

## Name

**Sketchy**

## Tagline

> **Keep your wireframes sketchy.**

Alternative:

> **Stop designing your wireframes.**

> **Draw less. Explain more.**

> **Rough screens. Clear ideas.**

## Personality

-   Lightweight
-   Casual
-   Fast
-   Slightly playful
-   Not corporate
-   Not overly polished

Sketchy 자체 UI도 이 철학을 따른다.

------------------------------------------------------------------------

# 32. Product Principle

Sketchy에서 기능 추가 여부를 판단할 때 다음 질문을 사용한다.

> **이 기능이 기획자가 디자인하는 시간을 줄이고, 기획 의도를 더 명확하게
> 전달하도록 돕는가?**

YES → 고려한다.

NO → 추가하지 않는다.

------------------------------------------------------------------------

Sketchy의 제품 범위를 판단할 때 Low-fi의 시각적 완성도를 목표로 삼지
않는다. 핵심은 **기획 정보의 입력 비용과 전달 비용을 줄이는 것**이다.

# 33. First Milestone

첫 번째 실제 구현 목표는 아주 작게 잡는다.

``` text
1. Sketchy Screen 생성
2. Button 삽입
3. 두 번째 Screen 생성
4. Button 선택
5. "Go to"에서 두 번째 Screen 선택
6. Interaction 저장
7. Figma Prototype 연결
8. 간단한 Spec 표시
```

첫 번째 데모의 성공 시나리오:

``` text
[ Login ]

Email
[             ]

Password
[             ]

[ Login ]
    │
    │ Click
    ▼
[ Home ]
```

`Login` 버튼을 선택하면:

``` text
Login Button

Click → Home
```

이 표시되고, Spec View에서는:

``` text
Login

Interactions

Login Button
- Click
- Navigate to Home
```

가 자동 생성된다.

**이 Vertical Slice가 완성된 이후 Wireframe Block 종류와 Flow Viewer를
확장한다.**

------------------------------------------------------------------------

# 34. Definition of Done for MVP

MVP는 다음 시나리오가 추가 문서 없이 동작할 때 완료된 것으로 본다.

> 기획자가 Sketchy를 처음 실행한다.\
> 두 개의 화면을 만든다.\
> 첫 번째 화면에 버튼을 추가한다.\
> 버튼을 두 번째 화면과 연결한다.\
> 해당 연결을 Prototype에서 실행할 수 있다.\
> Sketchy에서 Flow를 확인할 수 있다.\
> 동일한 연결 정보가 기능 명세에 자동으로 나타난다.

이 과정에서 사용자가 같은 정보를 두 번 입력해야 한다면 개선 대상으로
간주한다.
