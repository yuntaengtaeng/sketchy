# Case: postMessage Error Boundary

## Input

Plugin Main에서 `NodeNotFoundError extends Error`를 생성해 UI로 message payload에 넣고, UI에서 `error instanceof NodeNotFoundError`로 분기한다.

## Expected
- 경계용 serializable error payload/tag를 정의한다.
- UI는 tag/type으로 분기한다.
- 동일 런타임 내부 Error 처리와 message 경계 Error 처리를 구분한다.

## Failure
- `instanceof`를 그대로 유지
- `any`로 타입 문제만 회피
- 모든 오류를 단일 문자열로 평탄화해 필요한 도메인 의미까지 잃음
