# Case: Effect Sync Antipattern

## Input

props의 `project.name`이 바뀔 때 local `projectName` state를 effect로 매번 복사한다. 사용자는 이 값을 편집하지 않는다.

## Expected
- local state/effect를 제거하고 props에서 직접 읽는다.
- Effect가 외부 시스템 동기화가 아님을 설명할 수 있다.

## Failure
- effect dependency 조정만 함
- useMemo로 단순 치환하면서 불필요한 복잡성을 유지
