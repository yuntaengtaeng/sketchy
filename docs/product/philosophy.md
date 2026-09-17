# Sketchy 철학

> Sketchy가 무엇을 믿고, 무엇을 하지 않으며, 왜 존재하는지를 정의한다.
> 기능과 방향은 이 문서를 먼저 기준으로 판단한다.

## 한 줄 정의

> **Sketchy는 예쁜 와이어프레임을 만드는 도구가 아니다.**
> 기획 정보를 한 번만 입력하면 Prototype, Flow, Spec으로 파생되는 도구다.

Tagline: **Keep your wireframes sketchy.** / **Draw less. Explain more.**

## 존재 이유

기획 단계에서 필요한 것은 완성된 UI보다 다음 정보다.

1. 화면에 무엇이 있는가
2. 사용자가 무엇을 할 수 있는가
3. 행동하면 어디로 이동하는가
4. 각 요소는 어떻게 동작하는가

이 정보가 화면, Prototype, Flow, 명세에 흩어지면 변경할 때마다 사람이 여러
곳을 맞춰야 한다. Sketchy는 구조화된 Project를 한 번 편집하고, 같은 모델에서
Prototype, Flow, Spec을 파생해 반복 입력과 drift를 줄이기 위해 존재한다.

## 핵심 믿음

### Design less. Explain better.

기획자는 구조와 동작을 정의한다. 시각 디자인은 디자이너의 영역으로 남긴다.
기획 의도와 시각 디자인을 한 단계에서 섞지 않는다.

### Low-fi는 취향이 아니라 제약이다.

Low-fi는 사용자의 시각 디자인 비용을 의도적으로 제한해 구조, 기능, 흐름에
집중하게 만드는 제품 제약이다. 더 높은 시각 완성도 요구는 곧바로 가설 실패를
뜻하지 않는다. Sketchy가 해결할 범위와 표현 수준의 경계다.

### 검증 대상은 시각 선호가 아니라 동기화 비용이다.

검증 질문은 “기획자가 Low-fi를 좋아하는가?”가 아니다.

> 하나의 기획 결정을 입력해 Prototype, Flow, Spec이 같은 모델을 사용할 때,
> 화면·화살표·명세를 따로 관리하는 방식보다 빠르고 명확한가?

## 차별

### 생성보다 결정론적 파생

Sketchy가 관리하는 Prototype, Flow, Spec은 각각 따로 생성한 결과가 아니다.
같은 Project 모델을 목적에 맞게 투영한 결과다. 사용자가 Sketchy를 통해 변경한
정보는 각 산출물에 반복 입력하지 않는다.

Figma에서 직접 수행한 편집은 플러그인이 지원하는 삭제, 이름, 순서, 위치 변경
범위에서 로컬 Project와 보정한다. 모든 네이티브 편집을 Sketchy 의미 모델로
자동 해석한다고 약속하지 않는다.

### Interaction은 Project의 핵심 축이다.

Figma 파일 안의 Project가 유일한 원본이며 Screen, Element, Feature를 함께
보관한다. 그중 Interaction은 Prototype, Flow, Spec을 연결하는 핵심 데이터다.

```text
구매하기 Button → Click → 주문서 Screen
        ├─ Figma Prototype
        ├─ Flow
        └─ Spec
```

### 결정해야 하는 최소 정보만 입력한다.

경쟁력은 더 많이 생성하는 것이 아니라 기획자가 결정해야 하는 최소 정보만
입력하게 하는 데 있다.

```text
Screen: 상품 상세
Trigger: 구매하기 버튼
Action: 주문서 화면 이동
```

## 제품 원칙

- **Low Friction** — 주요 작업은 가능한 한 1~3개 동작 안에 끝낸다. 기본값만으로 시작할 수 있어야 한다.
- **One Source of Truth** — 같은 정보를 두 번 입력하지 않는다. Figma 파일 안의 Project가 모든 Sketchy 표현의 원본이다.
- **Low-fi by Default** — 예쁜 화면보다 빨리 이해되는 화면을 우선한다.
- **Visual First** — 긴 문서보다 `Draw → Connect → Describe` 순서로 일한다.
- **Progressive Complexity** — Condition, State, Exception은 필요할 때만 드러낸다.

## 하지 않는 것

- High-fidelity UI 생성
- 디자인 시스템 제공
- 코드, CSS, React 생성
- AI 기반 UI 디자인과 디자인 평가
- Project Management, Jira, Notion 대체
- 범용 Figma 편집기

Sketchy의 역할은 **Low-fi Wireframe + Interaction + Flow + Spec**이다.

## 제품 경계

- Figma 파일이 유일한 원본이며 Sketchy는 그 안에서 동작하는 로컬 플러그인이다.
- 별도 계정, 서버, 원격 동기화, 자체 MCP, Project JSON Import/Export를 제공하지 않는다.
- 공유, 권한, 버전, 기기 간 접근은 Figma에 위임한다.
- 외부 AI가 필요하면 사용자가 Figma 공식 기능을 직접 사용한다. Sketchy는 중계하지 않는다.
- 외부 네트워크와 자체 MCP를 두지 않아 Public 플러그인 심사 범위도 단순하게 유지한다.

## 기능 판단 기준

> **이 기능이 기획자가 디자인하는 시간을 줄이고, 기획 의도를 더 명확하게
> 전달하도록 돕는가?**

- YES → 고려한다.
- NO → 넣지 않는다.

Low-fi의 시각적 완성도를 제품 목표로 삼지 않는다. 핵심은 기획 정보의 입력
비용과 전달 비용을 줄이는 것이다.

## 브랜드 성격

Lightweight · Casual · Fast · Slightly playful · Not corporate · Not overly polished.
Sketchy 자체 UI도 이 성격을 따른다.

## 아직 검증되지 않은 질문

- Figma에 자주 머물지 않는 기획자가 플러그인으로 유입되는가?
- 별도 JSON/PDF 산출물 없이 Figma와 Spec만으로 핸드오프가 성립하는가?
- 실제 팀에서 기획 변경 시 여러 문서를 맞추는 비용이 반복적으로 발생하는가?

이 질문은 경쟁 기능을 더 조사하는 것보다 실제 사용자 관찰과 인터뷰로 검증한다.
