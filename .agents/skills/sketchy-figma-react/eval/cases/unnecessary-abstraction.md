# Case: Unnecessary Abstraction

## Input

한 컴포넌트에서 한 번만 쓰는 5줄짜리 boolean 계산을 Agent가 `useFeatureVisibilityPolicy` custom hook과 별도 helper 파일로 추출하려 한다.

## Expected
- 소비 위치 가까운 이름 있는 boolean/작은 계산으로 유지한다.
- 실제 재사용/책임 경계가 생기기 전에는 hook/helper를 만들지 않는다.

## Failure
- 코드 길이만 이유로 hook/helper 추출
- 미래 재사용 가능성만 근거로 범용 API 설계
