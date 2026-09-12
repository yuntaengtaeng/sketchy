# Sidebar UX 독립 검증 종합

## 검증 범위

- 방식: 두 시니어 UX 디자이너 관점의 구현 기반 인지적 워크스루
- 대상: 선택 기반 Inspector, breadcrumb, sibling navigation, Screen 작업
  우선순위, 한 단계 Section 중첩
- 한계: 실제 사용자 테스트나 시간 측정 결과가 아니다.

## 종합 판정

**부분 성공.** 전체 Layer Tree 없이 breadcrumb와 맥락 목록으로 탐색하는
방향은 적절하다. Screen 직속 Node에서 부모 Screen과 형제 Node로 이동하는
핵심 과업은 성공한다. 다만 중첩 Section 제작과 긴 Inspector에서는 탐색
규칙과 가시성이 아직 일관되지 않다.

## 공통 발견

### P1 · Section 형제 이동이 한 단계 더 필요함

일반 Element는 같은 부모의 형제 목록을 보여주지만 Section은 선택한
Section의 자식만 보여준다. 따라서 `Section 2 → Section 3`은 부모
`Section 1`을 거쳐야 한다. 두 평가자 모두 전체 Tree 대신 breadcrumb
인접 영역의 compact sibling selector를 최소 대안으로 권고했다.

### P1 · 탐색 수단을 Inspector보다 먼저 발견하기 어려움

Button의 Case가 길어지면 하단 형제 목록이 fold 아래로 밀린다. 형제 전환을
breadcrumb 근처의 compact control로 올리면 객체 타입과 Inspector 길이에
관계없이 같은 위치에서 이동할 수 있다.

### P1 · Section 내부 생성 후 즉시 편집 흐름이 끊김

Section 안에 새 Section/Button/Input을 추가하면 새 Node가 아니라 부모
Section이 선택된다. 생성한 Node를 즉시 편집하려는 과업에서는 목록에서
다시 찾아야 한다. 한 평가자는 생성 Node 즉시 선택을 권고했고, 다른
평가자는 반복 추가를 고려해 정책을 먼저 정하되 최소한 새 항목 강조가
필요하다고 봤다.

### P1 · 깊은 breadcrumb의 현재 항목 가시성이 보장되지 않음

360px에서 긴 이름과 네 단계 경로가 가로로 넘치지만 scrollbar가 숨겨져
있고 현재 항목 자동 스크롤이 없다. 현재 선택이 항상 보이도록 하고 overflow
단서를 제공해야 한다.

## 서로 다른 발견

- 생성 직후 포커스: 즉시 Inspector로 이동하는 안과 부모를 유지해 연속
  추가를 돕는 안이 갈렸다. 기본 행동을 하나로 확정하기 전에 실제 사용에서
  연속 추가와 즉시 편집 중 어느 빈도가 높은지 확인한다.
- `+ Screen`: 배치상 Secondary라는 점은 적절하지만 시각적 위계가 약하다는
  의견이 있었다. 오선택이 관찰되기 전에는 현재 위치를 유지한다.
- breadcrumb 현재 항목: 한 평가자는 불필요한 Tab stop을 줄이기 위해 현재
  crumb를 텍스트로 바꾸길 제안했다.

## 권장 다음 순서

1. Section을 포함한 모든 Node에서 같은 부모의 형제를 전환하는 compact
   selector를 breadcrumb 근처에 둔다.
2. 현재 crumb가 항상 보이도록 스크롤 위치와 overflow 표시를 보완한다.
3. `In X`의 혼용을 없애고 하단 목록은 `Inside X`인 자식 목록으로 정의한다.
4. 실제 사용 의견에 따라 생성 후에는 새 Node로 이동하지 않고 현재 Screen
   또는 Section을 유지해 연속적인 구조 작성을 지원한다.
5. Inspector 제목을 타입보다 선택 Node 이름 중심으로 바꾼다.

## 생성 후 포커스 결정 기록

검증에서는 `새 Node 즉시 선택`과 `부모 컨테이너 유지` 의견이 갈렸다. 실제
사용 의견에서 Add 이후 Inspector로 자동 이동하면 추가 UI가 사라져 구조를
먼저 잡는 사용자에게 반복적인 부모 복귀 비용이 생기는 것이 확인되었다.

따라서 기본 정책은 다음으로 확정한다.

```text
Screen에서 추가  → Screen 선택 유지
Section에서 추가 → Section 선택 유지
```

Sketchy의 Add는 “만든 Node를 즉시 상세 편집”보다 “현재 컨테이너에 구조를
계속 쌓기”를 우선한다. Screen과 Section의 결과도 동일하게 만들어 다음
상태를 예측할 수 있게 한다. 새 Node는 `Inside {container}` 목록과 Canvas에서
선택해 Inspector로 이동한다.

실제 관찰에서 생성 직후 상세 편집이 반복 추가보다 우세하다고 확인될 때만
자동 선택 정책을 재검토한다.

## 유지할 결정

- 전체 Figma Layer Tree를 만들지 않는다.
- Section 중첩은 한 단계까지만 허용한다.
- Screen에서는 `Add something`을 먼저, `+ Screen`을 나중에 둔다.
- Inspector와 탐색은 분리된 책임으로 유지한다.
