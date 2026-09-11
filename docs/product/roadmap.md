# 범위와 로드맵

MVP 범위, 이후 후보, 성공 기준과 완료 조건을 설명한다.

## Make it Sketchy --- Post-MVP

`Make it Sketchy`는 **MVP에 포함하지 않는다.**

Sketchy의 핵심인 Wireframe → Screen Feature → Flow → Spec 경험을 먼저
검증한 이후 Import 기능으로 고려한다.

목적:

> 기존 UI의 디자인을 가져오는 것이 아니라 **구조만 Sketchy 형태로
> 가져온다.**

### Existing Figma UI → Sketchy

우선순위가 더 높은 Import 방식이다.

기존 Figma Frame을 선택하고:

```text
Existing Figma UI
        ↓
  Make it Sketchy
        ↓
Low-fi Sketchy Screen
```

Figma Node 구조를 분석하여 가능한 요소를 Sketchy Block으로 변환한다.

제거:

- Color
- Shadow
- Brand styling
- Decorative border
- Typography styling
- 실제 이미지 표현

유지:

- Layout
- Text
- Content hierarchy
- 주요 UI 요소
- 화면 구조

Figma Node, Component/Instance 이름, Layout 정보 등을 활용한다.

의미를 확실하게 판단할 수 없는 요소는 임의로 복잡한 UI를 생성하지 않고
Generic Block으로 처리하거나 사용자에게 확인할 수 있도록 한다.

### Screenshot → Sketchy

Screenshot 변환은 더 후순위 기능으로 둔다.

일반 이미지에는 Figma Node 구조가 없기 때문에 Plugin API만으로 Button,
Input, List 등의 의미를 안정적으로 파악하기 어렵다.

필요한 경우 Vision 모델을 이용하여:

```text
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

```json
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

## MVP --- v0 Vertical Slice

Sketchy v0의 목적은 많은 Wireframe 기능을 제공하는 것이 아니다.

다음 핵심 경험 하나를 끝까지 검증한다.

```text
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

### v0에 포함

#### Screen

- Screen 생성
- Screen 이름
- 화면 설명

#### 최소 Block

- Text
- Button
- Input

Table, List, Modal 등은 v0에서 제외한다.

#### Feature

- 화면에 Feature 추가
- Feature 이름
- 설명
- 다른 Screen으로 이동
- 필요 시 Button과 Feature 연결

#### Flow

전체 프로젝트를 한 번에 시각화하지 않는다.

초기에는 선택한 Screen에서 시작하는 연결만 보여준다.

```text
Flow from this screen
```

#### Spec

Screen Details와 Feature 정보를 기반으로 최소 Spec을 자동 생성한다.

동일한 정보를 다시 작성하게 하지 않는다.

### v0에서 제외

다음 기능은 핵심 경험 검증 후 확장한다.

- 추가 Wireframe Blocks
- 복잡한 Condition / Exception
- 대규모 Flow 탐색
- Present Mode
- CSV / PDF / JSON Export
- Make it Sketchy
- Screenshot Vision 분석
- High-fidelity 표현 기능
- AI 기반 기능

### v0 성공 시나리오

```text
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

```text
Flow
Login ── 로그인 ──→ Home
```

과:

```text
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

## Success Criteria

Sketchy가 성공했다면 기획자는:

#### Before

```text
화면 그리기
→ 디자인 고민
→ 화살표 그리기
→ Prototype 설정
→ 기능 명세 작성
→ Flow 문서 작성
```

#### After

```text
화면 그리기
→ 동작 연결
→ 설명 추가

Done.
```

그리고 Sketchy가 자동으로:

```text
Wireframe
Prototype
Flow
Spec
Presentation
```

을 만들어준다.

## First Milestone

첫 번째 실제 구현 목표는 아주 작게 잡는다.

```text
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

```text
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

```text
Login Button

Click → Home
```

이 표시되고, Spec View에서는:

```text
Login

Interactions

Login Button
- Click
- Navigate to Home
```

가 자동 생성된다.

**이 Vertical Slice가 완성된 이후 Wireframe Block 종류와 Flow Viewer를
확장한다.**

## Definition of Done for MVP

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
