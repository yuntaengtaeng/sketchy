# 제품 개요

Sketchy가 해결하려는 문제, 핵심 가설, 사용자와 제품 경계를 설명한다.

## Product Vision

Sketchy는 "예쁜 와이어프레임을 만드는 도구"가 아니다.

기획 단계에서 필요한 것은 완성된 UI가 아니라 다음 네 가지다.

1.  화면에 무엇이 있는가
2.  사용자가 무엇을 할 수 있는가
3.  행동하면 어디로 이동하는가
4.  각 요소는 어떻게 동작하는가

Sketchy는 이 정보를 한 번만 작성하고 여러 형태로 재사용할 수 있게 한다.

```text
Wireframe
    ↓
Interaction
    ↓
Flow
    ↓
Spec
```

#### 핵심 원칙

> **Design less. Explain better.**

기획자는 구조와 동작을 정의한다.\
시각 디자인은 디자이너의 영역으로 남긴다.

## Product Hypothesis & Constraint

### Low-fi is a constraint, not a hypothesis

Sketchy는 **기획자가 Low-fi UI를 선호할 것**이라고 가정하지 않는다.

Low-fi는 기획 단계에서 시각 디자인에 소비되는 비용을 제한하고, 사용자가
화면의 **구조 · 기능 · 흐름**에 집중하도록 만들기 위한 제품적 제약이다.

따라서 Sketchy가 검증해야 하는 질문은 다음이 아니다.

```text
기획자는 Low-fi를 좋아하는가?
```

Sketchy가 실제로 검증해야 하는 것은 다음이다.

```text
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

- 화면 구조를 빠르게 표현할 수 있는가
- 화면에서 가능한 기능을 자연스럽게 작성할 수 있는가
- 화면 간 이동을 쉽게 정의할 수 있는가
- 동일한 기능/연결 정보를 반복해서 작성하지 않아도 되는가
- 생성된 Flow와 Spec을 디자이너와 개발자가 쉽게 이해할 수 있는가
- `Screen → Feature → Connection → Flow / Spec` Mental Model이 실제
  업무에서 자연스러운가

Low-fi의 시각적 선호도 자체는 핵심 가설로 취급하지 않는다.

사용자가 더 높은 시각적 완성도를 요구하더라도 이를 곧바로 제품 가설의
실패로 해석하지 않는다. 해당 요구는 Sketchy가 허용할 표현 범위와 제품
경계의 문제로 판단한다.

Sketchy는 이러한 요구를 무제한으로 수용하여 Mini Figma가 되는 것을
지양한다.

## Problem

현재 기획자가 Figma에서 화면을 설명할 때 흔히 다음 방식이 사용된다.

#### Case A --- 디자인까지 만들어버림

기획자가 색상, 아이콘, 이미지, 실제 컴포넌트 등을 사용해 거의 완성된
UI를 만든다.

문제:

- 기획 단계에서 불필요한 디자인 시간이 발생한다.
- 디자이너의 탐색 범위를 제한할 수 있다.
- 기획 의도와 시각 디자인이 섞인다.
- 디자인 변경 시 기획 문서도 다시 수정해야 한다.

#### Case B --- Screenshot 기반 기획

기존 서비스나 현재 제품 화면을 캡처하고 화살표와 텍스트를 붙인다.

문제:

- 화면 구조 수정이 어렵다.
- Flow가 커질수록 관리하기 어렵다.
- Screenshot과 실제 기능 명세가 분리된다.
- 어떤 요소가 실제 인터랙션 대상인지 알기 어렵다.

#### Case C --- 화면과 명세가 따로 존재

```text
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

## Target User

### Primary

서비스 / 프로덕트 기획자, PM, PO

특히 다음과 같은 사용자:

- Figma를 전문 디자인 도구 수준으로 사용할 필요는 없는 사람
- 빠르게 화면 구조를 표현하고 싶은 사람
- 개발자/디자이너에게 동작을 명확하게 전달해야 하는 사람
- 화면 Flow와 기능 명세를 함께 관리하고 싶은 사람

### Secondary

- UX Designer
- Product Designer
- Developer
- 초기 스타트업 팀

## Core Concept

Sketchy의 데이터 구조는 다음 관계를 중심으로 한다.

```text
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

```text
"구매하기" Button
       ↓
Click
       ↓
주문서 Screen
```

이 정보 하나로:

- Figma Prototype
- Flow Map
- 기능 명세
- Present Mode

를 생성한다.

## Product Modes

Sketchy는 크게 세 가지 모드로 구성한다.

```text
BUILD
  ↓
FLOW
  ↓
PRESENT
```

## UX Principles

### Low Friction

기획자는 Figma 전문가가 아니어도 사용할 수 있어야 한다.

가능한 작업은 1\~3개의 액션 안에서 완료한다.

Sketchy는 진짜 단순한 스케치 도구다.

- 사용자는 마우스로 고르고 누르는 것만으로 작업을 진행할 수 있어야 한다.
- 이름, 크기, 배치, 연결 표현은 기본값만으로 충분해야 한다.
- 설정과 입력은 결과에 꼭 필요할 때만 보여준다.
- 완성된 디자인보다 구조와 흐름을 빠르게 만드는 데 집중한다.

### One Source of Truth

동일한 정보를 여러 번 입력하지 않는다.

```text
Interaction 정의

→ Flow
→ Prototype
→ Spec
→ Present
```

모두 동일 데이터를 사용한다.

### Low-fi by Default

Sketchy가 생성하는 화면은 항상 Low-fi다.

예쁜 화면을 만드는 기능을 추가하는 것보다 빠르게 이해할 수 있는 화면을
만드는 것을 우선한다.

### Visual First

긴 문서를 먼저 작성하도록 요구하지 않는다.

```text
Draw
↓
Connect
↓
Describe
```

순서로 작업할 수 있어야 한다.

### Progressive Complexity

처음 사용하는 사용자는:

```text
Screen
Button
Connection
```

만 알아도 사용할 수 있어야 한다.

Condition, State, Exception 등의 고급 기능은 필요할 때만 노출한다.

## Non-goals

초기 Sketchy가 하지 않을 것:

- High-fidelity UI 생성
- 완성된 디자인 시스템 제공
- 개발 코드 생성
- CSS 생성
- React Component 생성
- 디자인 평가
- AI 기반 UI 디자인
- Project Management
- Jira 대체
- Notion 대체

Sketchy의 역할은 명확하다.

> **Wireframe + Interaction + Flow + Spec**

## Brand

### Name

**Sketchy**

### Tagline

> **Keep your wireframes sketchy.**

Alternative:

> **Stop designing your wireframes.**

> **Draw less. Explain more.**

> **Rough screens. Clear ideas.**

### Personality

- Lightweight
- Casual
- Fast
- Slightly playful
- Not corporate
- Not overly polished

Sketchy 자체 UI도 이 철학을 따른다.

## Product Principle

Sketchy에서 기능 추가 여부를 판단할 때 다음 질문을 사용한다.

> **이 기능이 기획자가 디자인하는 시간을 줄이고, 기획 의도를 더 명확하게
> 전달하도록 돕는가?**

YES → 고려한다.

NO → 추가하지 않는다.

Sketchy의 제품 범위를 판단할 때 Low-fi의 시각적 완성도를 목표로 삼지
않는다. 핵심은 **기획 정보의 입력 비용과 전달 비용을 줄이는 것**이다.
