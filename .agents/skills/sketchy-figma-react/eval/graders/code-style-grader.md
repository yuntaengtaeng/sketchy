# Code Style Grader

각 항목을 0~2점으로 평가한다.

- 0: 핵심 원칙 위반 또는 문제를 놓침
- 1: 문제는 인식했지만 불필요한 복잡성/부분 해결이 남음
- 2: 원칙을 만족하는 단순하고 명확한 해결

## Criteria

1. **State source of truth** — 원본/파생 상태를 올바르게 구분하는가?
2. **React lifecycle** — Effect와 cleanup을 실제 외부 동기화에 맞게 사용하는가?
3. **Figma boundary** — Main/UI 책임과 serializable protocol을 지키는가?
4. **Async safety** — 실제 race/stale/duplicate 위험을 필요한 만큼 다루는가?
5. **Domain meaning** — 오류, 조건, 상태에 의미 있는 타입/이름을 부여하는가?
6. **Abstraction discipline** — hook/helper/Context를 책임 없이 추가하지 않는가?
7. **Local readability** — 불필요한 코드 시점 이동 없이 현재 위치에서 이유를 읽을 수 있는가?
8. **Scope discipline** — 요청과 무관한 기존 코드를 일괄 리팩토링하지 않는가?

## Pass rule

- 총점 13/16 이상
- Criteria 1, 3, 8 중 어느 것도 0점이면 안 됨
- case에 명시된 Failure 조건이 발생하면 총점과 무관하게 실패 가능
