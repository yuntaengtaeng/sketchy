# Eval Suite

이 eval은 Agent가 `SKILL.md`를 읽었다는 사실이 아니라 실제 변경에서 핵심 판단을 지키는지 검증한다.

## 실행 방식

1. Agent에게 `SKILL.md`와 대상 case를 제공한다.
2. case의 Input에 대해 수정안 또는 리뷰를 생성하게 한다.
3. `graders/code-style-grader.md`로 결과를 평가한다.
4. Expected의 핵심을 만족하지 못하거나 Failure 조건을 만들면 실패로 본다.

## 대표 Cases

- `duplicate-derived-state.md`: 원본/파생 상태
- `effect-sync-antipattern.md`: Effect 남용
- `figma-runtime-boundary.md`: Main/UI 책임
- `postmessage-error-boundary.md`: Error/message 직렬화 경계
- `stale-async-response.md`: 비동기 경쟁
- `unnecessary-abstraction.md`: 의미 없는 hook/helper 추출
- `impossible-state.md`: boolean/null 조합
- `scope-creep.md`: 요청 밖 리팩토링

Eval은 특정 정답 코드의 문자열 일치를 요구하지 않는다. 동일한 원칙을 만족하는 더 단순한 구현은 통과할 수 있다.
