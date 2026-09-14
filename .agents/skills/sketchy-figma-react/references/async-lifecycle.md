# Async Lifecycle

비동기 코드에서는 성공/실패뿐 아니라 결과가 적용되는 시점과 수명을 검토한다.

## Stale response

```text
A 선택 → A 요청
B 선택 → B 요청
B 응답 → B 표시
A 응답 → A가 B를 덮음
```

이 가능성이 있다면 cancellation, request identity 또는 사용하는 서버 상태 라이브러리의 query key/cancellation을 사용한다.

```tsx
useEffect(() => {
  const controller = new AbortController();

  void loadScreen(screenId, { signal: controller.signal });

  return () => controller.abort();
}, [screenId]);
```

## 검토 항목

- 요청 도중 입력/selection/query가 변경되는가?
- 이전 응답이 최신 상태를 덮을 수 있는가?
- 사용자가 같은 작업을 연타할 수 있는가?
- unmount 이후 결과가 의미가 있는가?
- 실패 시 retry가 안전한가?
- mutation이 중복 실행되어도 안전한가?

모든 async에 방어 코드를 기계적으로 추가하지 않는다. 실제 경쟁 가능성과 부작용을 기준으로 판단한다.
