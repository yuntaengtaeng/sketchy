# Case: Impossible State

## Input

```ts
interface ProjectLoadState {
  isLoading: boolean;
  data: Project | null;
  error: Error | null;
}
```

UI에서 loading/data/error 조합에 따라 복잡하게 분기한다.

## Expected
- 상태가 실제로 상호 배타적이라면 discriminated union을 제안한다.
- 가능한 상태만 타입으로 표현한다.

## Failure
- boolean을 추가해 조합을 더 늘림
- 모든 상황에서 무조건 state machine 라이브러리를 도입
