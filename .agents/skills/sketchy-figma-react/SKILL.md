---
name: sketchy-figma-react
description: Apply Sketchy-specific React UI, Figma Plugin runtime, typed message-boundary, state, effect, and async-lifecycle rules when changing or reviewing src/ui, src/plugin, or their shared protocol.
---

# Sketchy Figma + React

`sketchy-code-style`을 먼저 적용하고 이 Skill로 Figma/React 런타임 판단을 보강한다. 일반적인 최소 구현과 범위 원칙은 `AGENTS.md`와 `ponytail`에 맡긴다.

기존 코드 전체를 일괄 수정하지 않는다. 요청 범위의 새 코드와 실제로 건드리는 코드에 적용한다.

## Scope

이 Skill은 React 상태 모델링, 컴포넌트/Hook 책임, 비동기 흐름, Figma Plugin Main ↔ UI 실행 경계를 다룬다. `core`, API, MCP의 세부 규칙에는 적용하지 않는다. 포매팅, import 순서, Git/커밋 규칙은 프로젝트의 기존 도구와 규칙을 따른다.

## 판단 우선순위

1. 실행 환경과 책임의 경계를 넘기지 않는다.
2. 하나의 사실은 하나의 원본 상태로 표현한다.
3. 비즈니스 의미가 있는 오류와 조건은 이름으로 표현한다.
4. 관련 로직은 함께 읽을 수 있는 가까운 위치에 둔다.
5. Hook/helper/Context는 실제 책임 또는 재사용 경계가 있을 때만 도입한다.
6. 추상화가 코드 이동만 늘린다면 명시적인 코드를 선택한다.
7. 공통 도메인 규칙은 `core`/`shared`에서 재사용하고 런타임별로 복제하지 않는다.

## 0. Figma Plugin 실행 경계를 지킨다

Plugin Main과 React UI는 서로 다른 실행 환경이다.

- `figma.*`, Document/SceneNode 탐색 및 수정은 Plugin Main 책임이다.
- 렌더링, 사용자 입력, UI 상태와 사용자 피드백은 React UI 책임이다.
- Main ↔ UI는 serializable message contract로 통신한다.
- `SceneNode`, `FrameNode` 같은 런타임 객체를 UI state/props/message의 장기 데이터로 사용하지 않는다. 필요한 DTO 또는 ID로 변환한다.
- 경계를 넘는 오류는 custom Error의 `instanceof` 정체성을 신뢰하지 않는다. tagged payload/discriminated union으로 전달한다.
- message type 문자열을 여러 위치에서 임의 작성하지 않고 typed protocol로 정의한다.

상세: `references/figma-plugin-boundaries.md`

## 1. 원본 상태만 보관

다른 값에서 바로 계산할 수 있는 값은 state로 중복 보관하지 않는다. state 제거 자체가 목적이 아니라 하나의 사실에 하나의 원본을 유지하는 것이 목적이다.

```tsx
const [detailId, setDetailId] = useState<string | null>(null);

<DetailDialog
  open={detailId !== null}
  detailId={detailId}
  onClose={() => setDetailId(null)}
/>;
```

Entity 선택은 가능한 경우 ID를 원본으로 보관하고 객체는 현재 목록에서 계산한다. 서버/원본 Entity와 편집 중 Draft는 생명주기가 다르면 명시적으로 분리한다.

## 2. Effect는 외부 시스템 동기화에 사용

렌더 중 계산 가능한 값을 `useEffect + setState`로 복제하지 않는다.

```tsx
const selectedScreen =
  screens.find(screen => screen.id === selectedScreenId) ?? null;
```

Effect가 적절한 예는 message/event listener, timer, 외부 SDK, DOM/browser API 등 React 외부 시스템과의 동기화다. Effect를 추가할 때는 “React 밖의 어떤 시스템과 동기화하는가?”를 답할 수 있어야 한다. 구독/listener/timer는 cleanup 수명을 함께 검토한다.

상세: `references/react-state-and-effects.md`

## 3. 알려진 오류는 도메인 의미로 변환

UI가 특정 HTTP 상태나 서버 오류 코드에 따라 다른 복구 행동을 제공해야 하면 transport 구조를 컴포넌트까지 전파하지 않는다. API/service 경계에서 알려진 응답을 도메인 오류로 변환한다. 단순 표시용 오류는 기존 공통 오류 흐름을 유지한다.

동일 런타임 내부에서는 custom Error + `instanceof`를 사용할 수 있다. Plugin Main ↔ UI 경계를 넘을 때는 class identity를 전제로 하지 않고 serializable error payload를 사용한다.

알려지지 않은 오류, 네트워크 오류, 5xx는 기존 공통 오류 흐름을 유지한다.

## 4. 응집도 있는 custom hook 사용

상태와 동작이 하나의 기능 책임으로 설명될 때만 custom hook으로 분리한다.

적절한 예: 데이터 조회/갱신/로딩/오류가 하나의 기능 흐름인 경우, 여러 컴포넌트가 같은 상태 기반 동작을 공유하는 경우, `useScreenDraft`처럼 하나의 이름으로 설명 가능한 상호작용.

순수 계산은 utility, HTTP transport는 service, 화면 조립은 component에 두고 hook은 상태 기반 흐름에 집중한다. 반환값이 서로 무관하게 계속 늘거나 렌더 구조를 이해하려고 hook 내부를 반복해서 왕복한다면 분리를 다시 검토한다.

## 5. 복잡한 조건과 정책 값에 이름 부여

둘 이상의 의미를 결합하거나 비즈니스 규칙을 표현하는 조건은 소비 위치 가까이에서 `is`, `has`, `can`, `should` 등의 이름을 부여한다. 시간, 크기 제한, 상태 코드, 재시도 횟수처럼 정책/단위가 있는 값도 이름 있는 상수로 표현하고 가능한 경우 단위를 이름에 포함한다.

자명한 비교나 정책 의미가 없는 값까지 기계적으로 추출하지 않는다.

## 6. 코드 시점 이동 최소화

한 곳에서만 사용하는 짧은 정책을 멀리 떨어진 helper로 이동시키지 않는다. 여러 화면이 공유하는 실제 도메인 정책이거나 독립적으로 테스트할 가치가 있을 때 분리한다.

함수 추출 전에 호출부와 구현부를 오가는 비용이 실제로 줄어드는지 확인한다.

## 7. 중첩 삼항 연산자 제거

삼항 연산자는 단순한 양자 선택에만 사용한다. 중첩되거나 우선순위 해석이 필요하면 `if`/`switch`로 펼친다. 독립된 도메인 규칙이면 이름 있는 함수로 분리한다. 표현식을 만들기 위한 IIFE를 기본 패턴으로 사용하지 않는다.

## 8. 불필요한 Props Drilling 제거

props 전달 자체는 문제가 아니다. 중간 컴포넌트가 사용하지 않고 전달만 하는 값이 많아질 때 다음 순서로 검토한다.

1. 상태와 실제 소비 컴포넌트를 가까이 배치
2. children/composition
3. 여러 깊은 하위 컴포넌트가 동일 기능 상태를 공유할 때 feature 범위 Context
4. 명확한 공유 수명이 있을 때만 Context

단순히 props 개수를 줄이기 위해 모든 값과 handler를 Context로 이동하지 않는다.

## 9. 불가능한 상태를 타입으로 제거

서로 배타적인 상태를 여러 boolean/null 조합으로 표현하지 않는다. 의미 있는 상태 머신이면 discriminated union을 우선 검토한다.

```ts
type ProjectState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Project }
  | { status: 'error'; error: Error };
```

Boolean props도 서로 배타적인 variant를 표현하기 시작하면 union/variant prop으로 바꾼다.

## 10. 비동기 결과의 수명과 최신성을 검토

selection, query, screen 등이 빠르게 변경될 수 있는 비동기 작업은 이전 결과가 최신 상태를 덮어쓸 수 있는지 검토한다.

- 취소 가능한 요청은 AbortController/라이브러리 cancellation을 고려한다.
- 동일 작업의 연타/중복 실행이 가능한지 확인한다.
- 컴포넌트 unmount 또는 selection 변경 후 결과 적용 여부를 확인한다.
- 서버 상태 라이브러리를 사용한다면 query key/cancellation/cache를 우선 활용하고 동일 데이터를 local state로 복제하지 않는다.

상세: `references/async-lifecycle.md`

## 11. Memoization은 기본값이 아니다

`useMemo`, `useCallback`, `React.memo`는 구조적 관례가 아니라 최적화 도구다. 실제 비용, reference identity 계약, profiling 근거가 있을 때 사용한다. 단순 함수/객체 재생성만으로 기계적으로 도입하지 않는다.

## References

- Figma runtime/message/error 경계: `references/figma-plugin-boundaries.md`
- React state/effect 판단: `references/react-state-and-effects.md`
- 비동기 수명주기: `references/async-lifecycle.md`
- 대표 패턴과 안티패턴: `references/patterns.md`
- 변경 리뷰: `checklists/review-checklist.md`
- Skill 준수 검증: `eval/README.md`

## 작업 완료 전

변경한 경로에 해당하는 항목만 `checklists/review-checklist.md`로 점검한다. 코드 스타일 판단이 애매하거나 큰 리팩토링을 제안하기 전에는 관련 reference를 확인한다. Skill 자체를 변경했거나 Agent 동작 품질을 검증할 때만 `eval/`의 대표 case를 사용한다.
