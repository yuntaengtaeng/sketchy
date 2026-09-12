# 제품 경험

Build, Flow, Spec으로 이어지는 사용자 경험과 화면별 동작을 설명한다.

## Build Mode

기획자가 Low-fi Wireframe을 만드는 영역.

### Wireframe Blocks

기본 제공 블록:

#### Basic

- Text
- Button
- Icon Placeholder
- Image Placeholder
- Divider
- Badge

#### Input

- Text Input
- Textarea
- Checkbox
- Radio
- Switch
- Select
- Search

#### Navigation

- Header
- Tabs
- Bottom Navigation
- Sidebar
- Breadcrumb

#### Content

- List
- List Item
- Card
- Table
- Table Row
- Pagination
- Accordion

#### Feedback

- Alert
- Toast
- Modal
- Bottom Sheet
- Empty State
- Loading
- Error State

### Intentionally Low-fi

Sketchy 컴포넌트는 의도적으로 디자인 기능을 제한한다.

지원하지 않거나 최소화할 것:

- 자유로운 Color Picker
- Gradient
- Shadow
- Decorative Border
- Custom Font
- 실제 서비스 Icon Set
- 복잡한 visual styling

기본 스타일은 neutral wireframe 스타일을 사용한다.

목적:

> 기획자가 디자인하는 것을 방지하고 구조에 집중하게 한다.

## Block Picker

Sketchy는 명령어를 외우는 방식보다 **보고 선택하는 방식**을 기본
인터랙션으로 사용한다.

기획자가 Figma나 개발 도구에 익숙하지 않아도 사용할 수 있도록 한다.

기본 흐름:

```text
Select
  ↓
Configure
  ↓
Insert
```

플러그인 패널에서는 Wireframe Block을 카테고리별로 보여준다.

```text
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

```text
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

```text
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

## Screen Details

Sketchy의 중심 객체는 Element가 아니라 **Screen**이다.

기획자는 특정 Button의 속성을 정의하는 것부터 시작하지 않는다.

대신:

```text
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

### Selection-aware Sidebar

Build Sidebar는 Figma Canvas의 현재 선택을 기준으로 편집 대상을 바꾼다.

```text
선택 없음  → Screen 탐색 / + Screen
Screen     → Screen 정보 / Add something / + Screen
Section    → Section 설정 / Add to section / 자식 Node
Element    → Element 설정 / 같은 부모의 형제 Node
```

선택된 객체의 전체 조상 경로를 클릭 가능한 breadcrumb로 표시한다.

```text
Checkout / Actions / Purchase form / Buy button
```

breadcrumb는 위로 이동하는 수단이다. 그 아래 `Switch in {parent}` Select는
현재 Node와 같은 부모를 가진 형제로 이동하며 Section에도 같은 규칙을
적용한다. Section의 `Inside {section}` 목록은 선택한 Section의 직접 자식만
보여준다. Sidebar는 전체 Figma Layer Tree를 복제하지 않고 현재 맥락에서
필요한 조상, 형제와 자식만 보여준다.

긴 breadcrumb는 현재 선택 항목을 자동으로 보이는 위치까지 스크롤한다.
가로로 넘치는 경로를 발견할 수 있도록 이 영역의 scrollbar는 숨기지 않는다.

Screen에서는 `Add something`을 Primary 작업으로 두고, 사용자가 이미 쉽게
찾는 `+ Screen`은 Secondary 작업으로 유지한다. Element를 선택하면 해당
Inspector를 첫 콘텐츠로 보여주고 Screen/Block 편집 UI는 숨긴다.

Block을 추가한 뒤에는 새 Element로 자동 이동하지 않고 현재 컨테이너인
Screen 또는 Section 선택을 유지한다. 사용자는 여러 Block으로 구조를 먼저
연속해서 만든 뒤 `Inside` 목록이나 Canvas에서 필요한 Element를 선택해
설정한다.

이 결정의 근거:

- `Add something`과 `Add to section`은 현재 컨테이너의 구조를 만드는 반복
  작업이다. 매번 새 Element Inspector로 이동하면 추가 UI가 사라져 부모로
  돌아오는 비용이 발생한다.
- Screen 직속 추가와 Section 내부 추가가 서로 다른 선택 결과를 만들면
  사용자가 다음 화면을 예측하기 어렵다. 두 경우 모두 컨테이너 선택을
  유지한다.
- Sketchy는 속성을 하나씩 정교하게 편집하는 디자인 도구보다 먼저 화면
  구조를 빠르게 잡는 Low-fi 도구다. 구조 작성의 연속성을 기본값으로 둔다.
- 방금 추가한 Element는 `Inside {container}` 목록과 Canvas에 바로 나타나므로
  설정이 필요한 사용자는 명시적으로 선택할 수 있다.

향후 실제 관찰에서 대부분의 사용자가 매번 생성 직후 이름이나 Action을
수정하며 부모 복귀보다 재선택 비용이 더 크다고 확인될 때만 생성 Node 자동
선택 또는 `Add and edit` 같은 별도 결과를 검토한다.

Input Inspector에는 이름과 향후 Placeholder, Validation, Error 표현 같은
Input 자체 설정을 둔다. 실행 가능한 Trigger가 구현되기 전에는 Button과 같은
Action 편집기를 노출하지 않는다.

### Section hierarchy

Low-fi 화면의 큰 영역과 내부 영역을 표현할 수 있도록 Section 중첩은 한
단계만 허용한다.

```text
Screen
└─ Section
   ├─ Section
   │  └─ Element
   └─ Section
      └─ Element
```

세 번째 Section 중첩은 허용하지 않는다. 각 Section의 Vertical/Horizontal
방향으로 기본 레이아웃을 만들되 범용 Layer 구조나 자유 배치 도구로 확장하지
않는다.

예:

```text
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

## Screen Feature

화면에서 수행할 수 있는 행동을 **Feature(기능)** 단위로 관리한다.

기능 추가의 기본 UI는 단순해야 한다.

```text
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

```text
Screen
  │
  ├─ Feature
  │    ├─ Element (optional)
  │    └─ Destination
  │
  └─ Feature
```

초기 지원 동작:

- 다른 화면으로 이동
- 이전 화면으로 이동
- Modal 표시
- Bottom Sheet 표시
- 메시지 표시
- 상태 변경
- 외부 링크
- 기타

## Conditions

조건은 기본 입력으로 강제하지 않는다.

필요한 Feature에서만 `+ 조건 추가`를 통해 확장한다.

예:

```text
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

## Screen Spec

Screen Details에 입력한 정보 자체가 기능 명세의 원본 데이터가 된다.

별도의 기능 명세서를 처음부터 다시 작성하지 않는다.

예:

```text
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

## Flow Mode

Sketchy의 주요 차별화 기능.

선택한 Screen 또는 Flow를 Fullscreen 형태로 시각화한다.

예:

```text
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

## Flow Node

각 Screen은 Flow에서 Node로 표시한다.

Node에는 최소 정보만 표시한다.

```text
┌──────────────────┐
│ 상품 상세         │
│                  │
│ [wireframe]      │
│                  │
│ 3 interactions   │
└──────────────────┘
```

Node 선택 시 상세 패널을 표시한다.

```text
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

## Connection Detail

Flow의 연결선을 선택하면 Interaction 정보를 표시한다.

```text
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

## Flow Filtering

대규모 서비스의 Flow가 복잡해지는 것을 방지한다.

지원 후보:

```text
Show

● Current Flow
○ From this screen
○ To this screen
○ All connected screens
```

조건별 필터:

```text
☑ Main Flow
☑ Alternative
☐ Error
☐ Edge Case
```

## Present Mode --- Post-v0

회의 / 리뷰용 모드.

Flow Map 대신 하나의 Screen에 집중한다.

```text
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

## Spec View

프로젝트 또는 특정 Flow의 기능 명세를 자동으로 구성한다.

예:

```text
## 상품 상세

### Purpose

상품 정보를 확인하고 구매한다.

### Entry

상품 목록 → 상품 선택

### States

- Default
- Loading
- Sold Out
- Error

### Interactions

#### 구매하기

Trigger
Click

Condition
필수 옵션 선택 완료

Destination
주문서

Otherwise
옵션 선택 Alert

#### 찜하기

Trigger
Click

Condition
로그인 상태

Destination
찜 완료
```

## Spec Export

초기 후보:

- Markdown
- Plain Text

향후:

- CSV
- PDF
- JSON

JSON Export는 다른 도구와 연동할 수 있도록 내부 데이터 구조와 최대한
일치시킨다.

예:

```json
{
  "screen": {
    "id": "product-detail",
    "name": "상품 상세",
    "purpose": "상품 정보를 확인하고 구매한다.",
    "states": ["default", "loading", "sold-out", "error"],
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
