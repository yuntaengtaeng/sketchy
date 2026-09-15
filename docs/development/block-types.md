# 블록과 속성 모델

`BlockType`별 속성을 어떻게 타입, 캔버스 렌더링, UI로 이어 붙이는지와 새
블록을 추가하는 절차를 설명한다. 트리거(Feature) 확장은
[기능 모델](../product/feature-model.md#feature를-발생시킬-수-있는-요소)을
따른다.

## Element는 BlockType별 discriminated union이다

`Element`는 모든 필드를 한 번에 갖는 평평한 타입이 아니라, `BlockType`마다
자기 필드만 갖는 union이다(`src/shared/index.ts`).

```ts
type ElementVariant<
  T extends BlockType,
  Traits extends object = object,
> = ElementBase & { type: T } & Traits;

type Element =
  | ElementVariant<"text", TextSize>
  | ElementVariant<"button", ButtonVariant>
  | ElementVariant<"checkbox", Checked>
  | ElementVariant<"tabs", TabItems>;
// ...
```

`type: "text"`인 값에는 `buttonVariant`나 `checked` 같은 필드를 애초에 넣을
수 없다 — 불가능한 조합을 컴파일 타임에 막는다(`sketchy-code-style`의
discriminated union 우선 원칙). trait는 여러 BlockType이 공유할 수 있고
(`Checked`는 checkbox/radio/switch가 공유), 그 값의 의미(라벨 문구 등)는
UI 쪽에서 블록별로 다르게 붙인다.

일반 `Omit<Element, "nodeId">`는 union의 key 교집합만 남기므로 variant별
필드가 사라진다. `core/project-change.ts`의 `DomainElement`는 각 variant에
개별로 Omit을 분배하는 `DistributiveOmit`을 쓴다.

## 현재 블록과 속성

| Block                   | 속성                                         | Trigger |
| ----------------------- | -------------------------------------------- | ------- |
| Text                    | `textSize` (5단계, Regular 고정)             | –       |
| Button                  | `buttonVariant` (filled/outline)             | click   |
| Input                   | `placeholder`                                | –       |
| Image, Divider, Section | (Section만 `direction`)                      | –       |
| List Item               | `itemType` (basic/leading/trailing), `count` | click   |
| Card                    | `cardType` (basic/media/stat), `count`       | click   |
| Table                   | `columns: string[]`, `count`                 | –       |
| Tabs                    | `tabItems: string[]`                         | –       |
| Select                  | `options: string[]`, `displayState`          | –       |
| Checkbox, Radio, Switch | `checked: boolean` (공유 필드)               | –       |
| Search                  | (고정 UI, 속성 없음)                         | –       |

List Item/Card의 `itemType: "leading"`은 아이콘이 아니라 작은 회색
이미지 자리(Image 블록과 같은 표현)를 쓴다 — 아이콘 자체를 표현하는
블록이 아직 없어서다.

## 반복 콘텐츠 — List Item / Card / Table

이 세 블록은 실제로 N개의 Element를 따로 추가하는 대신, **하나의 Element가
`count`만큼 내부에 행/카드를 반복해서** 목록·표처럼 보이게 한다
(`element-render.ts`의 `clampCount`, 1~6으로 제한). `count`나 구성
속성(`itemType`/`cardType`/`columns`)이 바뀌면 매번 전체를 지우고
다시 그린다(부분 diff 대신 전체 rebuild, 개수가 작아 단순함을 우선).

## Picker UI — Quick add + 카테고리

`BlockPicker.tsx`는 Text/Button/Input/Image 4개 고정 + 마지막으로 고른
블록 1개(Recent) + `More…`만 항상 보여준다. `More…`를 누르면 열리는
Picker는 [기능 모델](../product/feature-model.md)의 Trigger 축(트리거
없음/click/change·submit)과 같은 기준으로 Basic/Interactive/Form 세
카테고리로 나눈다 — Picker 전용의 새 분류체계를 따로 만들지 않는다. 블록이
늘어나도 Quick add 줄 길이는 고정이라 Build 패널이 계속 길어지지 않는다.

## 새 블록을 추가하는 절차

1. `src/shared/index.ts`: `BLOCK_DEFINITIONS`에 항목 추가(`triggers`는
   일단 `[]`로 시작). 필요하면 trait 타입을 정의하고 `Element` union에
   `ElementVariant<"새타입", 그Trait>`로 조합. 새 `PluginMessage`도 여기.
2. `src/mcp/schemas.ts`의 `element` discriminated union에도 **반드시**
   같은 variant를 추가한다. 여기를 빼먹으면 타입은 통과하지만 Figma
   Plugin이 push할 때 서버가 400으로 거절한다(Zod가 알 수 없는 타입/필드를
   `.strict()`로 거절).
3. `src/plugin/commands/canvas/element-render.ts`: `createElementNode`가
   호출하는 `createFrameFor`에 분기 추가, 실제 Figma 노드 구조를 만드는
   함수 작성. 새 auto-layout 컨테이너를 만들 때는 반드시 `hugFrame`
   헬퍼(또는 `primaryAxisSizingMode`/`counterAxisSizingMode`를 `"AUTO"`로
   직접 설정)를 쓰고, `layoutSizingHorizontal` 등은 `appendChild` **이후**
   에만 설정한다 — 자세한 이유는
   [Figma Plugin API 사용 현황의 Auto Layout 함정](./figma-api.md)을 본다.
4. `src/plugin/commands/canvas/element.ts`: `setX` 커맨드 작성(기존
   `setButtonVariant`/`setChecked` 패턴 참고), `index.ts` barrel에 export
   추가.
5. `src/plugin/main.ts`: 새 `PluginMessage` 타입을 처리하는
   `if (message.type === "SET_X") await sync(await setX(...));` 추가,
   import 갱신.
6. `src/ui/components/properties/`에 이미 있는 공유 컨트롤
   (SegmentedField/CheckedField/StringListField/CountField)로 표현 가능한지
   먼저 확인하고, 안 맞으면 새로 만든다. `src/ui/features/build/`에 그
   블록 전용 `XOptions.tsx`를 만들고 `blockRegistry.ts`에 등록한다.
7. `npm run check`, `npm run build`, 관련 좁은 테스트를 돌린다.
