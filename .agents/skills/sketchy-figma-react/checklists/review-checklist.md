# Frontend Code Review Checklist

모든 항목을 기계적으로 수정하지 않는다. 변경한 코드와 요청 범위를 중심으로 검토한다.

## State
- [ ] 같은 사실을 두 state가 표현하지 않는가?
- [ ] ID와 Entity 객체를 동시에 원본 state로 보관하지 않는가?
- [ ] 렌더 중 계산 가능한 값을 state + effect로 동기화하지 않는가?
- [ ] 저장 Entity와 편집 Draft의 생명주기를 구분했는가?
- [ ] 여러 boolean/null 조합으로 불가능한 상태를 만들지 않는가?

## React
- [ ] Effect가 실제 외부 시스템 동기화인가?
- [ ] listener/timer/subscription cleanup이 필요한가?
- [ ] custom hook 책임을 하나의 기능 이름으로 설명할 수 있는가?
- [ ] Context보다 상태 배치/composition이 단순하지 않은가?
- [ ] useMemo/useCallback/React.memo에 실제 이유가 있는가?

## Figma Plugin
- [ ] `figma.*` 접근과 document mutation이 Main에 있는가?
- [ ] Figma Node 객체를 UI state/props/message로 넘기지 않는가?
- [ ] Main ↔ UI message가 typed protocol인가?
- [ ] command/event 방향이 명확한가?
- [ ] 경계를 넘는 Error를 `instanceof`에 의존하지 않는가?
- [ ] Figma node ID와 domain ID가 혼동되지 않는가?

## Async
- [ ] 이전 응답이 최신 상태를 덮을 가능성이 있는가?
- [ ] selection/query 변경 시 cancellation 또는 stale 방지가 필요한가?
- [ ] 연타/중복 mutation이 문제가 되는가?
- [ ] 알려진 서버 오류가 적절한 경계에서 도메인 의미로 변환되는가?

## Readability
- [ ] 복잡한 조건과 정책 값에 의미 있는 이름이 있는가?
- [ ] 단위가 있는 상수 이름에 단위가 드러나는가?
- [ ] 현재 동작을 이해하기 위해 파일/helper를 불필요하게 왕복하는가?
- [ ] 중첩 삼항이 조건 우선순위를 숨기지 않는가?
- [ ] 추상화가 책임을 줄였는가, 코드 위치만 이동시켰는가?

## Scope
- [ ] 요청 범위 밖 기존 코드를 이유 없이 리팩토링하지 않았는가?
- [ ] 결과가 요청을 만족하는 가장 단순한 구현인가?
