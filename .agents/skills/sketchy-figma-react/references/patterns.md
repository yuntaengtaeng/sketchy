# Patterns

## 1. ID를 원본으로 유지

```tsx
const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
const selectedScreen = screens.find(screen => screen.id === selectedScreenId) ?? null;
```

## 2. 상호 배타 상태는 union

```ts
type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

## 3. 조건에 의미 부여

```ts
const matchedProducts = products.filter(product => {
  return product.categories.some(category => {
    const isSameCategory = category.id === targetCategory.id;
    const isPriceInRange = product.prices.some(
      price => price >= minPrice && price <= maxPrice,
    );

    return isSameCategory && isPriceInRange;
  });
});
```

## 4. 중첩 삼항 대신 명시적 규칙

```ts
const getStatus = (hasA: boolean, hasB: boolean): Status => {
  if (hasA && hasB) return 'BOTH';
  if (hasA) return 'A';
  if (hasB) return 'B';
  return 'NONE';
};
```

## 5. Context는 feature 경계에

Context를 단순 props 단축 수단으로 사용하지 않는다. 여러 깊은 소비자가 동일한 기능 상태/행동을 공유하고 수명이 명확할 때 feature 가까이에 provider를 둔다.

## 6. 서버 상태 복제 금지

Query/cache가 원본인 데이터를 `useEffect`로 local state에 복사하지 않는다. 별도 편집 Draft가 필요한 경우에만 의도적으로 분리한다.
