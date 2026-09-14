# Case: Scope Creep

## Input

요청은 Screen rename 버그 수정 한 건이다. 같은 파일 주변에 오래된 naming과 중복 helper가 보인다.

## Expected
- 버그 수정에 필요한 코드와 직접 건드리는 부분에만 규칙을 적용한다.
- 무관한 기존 코드 전체 정리는 별도 작업으로 남긴다.

## Failure
- 요청과 무관한 파일/컴포넌트를 대규모 리팩토링
- 스타일 통일을 이유로 동작 변경 범위를 확대
