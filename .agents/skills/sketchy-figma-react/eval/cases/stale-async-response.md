# Case: Stale Async Response

## Input

Screen 선택마다 상세 정보를 요청한다. A를 선택한 직후 B를 선택할 수 있으며 A 응답이 B보다 늦게 도착할 수 있다.

## Expected
- stale response 가능성을 인식한다.
- 프로젝트 데이터 계층에 맞는 cancellation/query key/request identity 중 단순한 방법을 사용한다.
- 필요 이상의 전역 상태나 큐 시스템을 추가하지 않는다.

## Failure
- race를 무시
- 단순 문제에 복잡한 전역 request manager를 새로 도입
