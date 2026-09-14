# Case: Duplicate Derived State

## Input

```tsx
const [selectedId, setSelectedId] = useState<string | null>(null);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

useEffect(() => {
  setSelectedItem(items.find(item => item.id === selectedId) ?? null);
}, [items, selectedId]);
```

## Expected
- `selectedId`를 원본으로 유지한다.
- `selectedItem`은 렌더 중 계산한다.
- 동기화용 effect를 제거한다.

## Failure
- 두 state 유지
- dependency만 변경
- 동일 로직을 custom hook으로 이동만 함
