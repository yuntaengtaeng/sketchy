# React State and Effects

## 원본과 파생값

피해야 할 구현:

```tsx
const [selectedId, setSelectedId] = useState<string | null>(null);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

useEffect(() => {
  setSelectedItem(items.find(item => item.id === selectedId) ?? null);
}, [items, selectedId]);
```

권장:

```tsx
const [selectedId, setSelectedId] = useState<string | null>(null);
const selectedItem = items.find(item => item.id === selectedId) ?? null;
```

## Effect 판단 질문

Effect를 작성하기 전에 묻는다.

> React 밖의 어떤 시스템과 동기화하고 있는가?

명확한 답이 없다면 렌더 계산, 이벤트 핸들러, state 구조 변경으로 해결할 수 있는지 먼저 검토한다.

Effect가 자연스러운 대상:

- window/document event
- Plugin message listener
- timer
- external SDK subscription
- imperative browser/DOM API

## Cleanup

등록과 해제를 함께 읽을 수 있게 둔다.

```tsx
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    // ...
  };

  window.addEventListener('message', handleMessage);

  return () => {
    window.removeEventListener('message', handleMessage);
  };
}, []);
```

## Draft

서버/프로젝트 Entity 자체와 편집 중 입력은 동일한 사실이 아닐 수 있다. Cancel/Save/dirty validation이 필요한 편집 흐름이면 필요한 필드만 Draft로 만든다.

## Memoization

`useMemo`/`useCallback`은 correctness를 위한 기본 장치가 아니다. 실제 계산 비용, reference identity 계약 또는 profiling 근거가 없다면 단순 코드를 우선한다.
