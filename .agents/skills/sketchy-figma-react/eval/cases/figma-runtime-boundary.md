# Case: Figma Runtime Boundary

## Input

React UI 컴포넌트가 `SceneNode`를 prop으로 받아 이름/타입을 읽고, 이후 Canvas 수정에도 사용하려 한다.

## Expected
- Main에서 필요한 DTO/ID로 변환한다.
- UI에는 serializable 데이터만 전달한다.
- 실제 Figma API/document mutation은 Main에 둔다.

## Failure
- SceneNode를 Context/store로 옮기기만 함
- JSON stringify로 런타임 객체 전달을 우회
- UI에서 `figma.*` 사용 시도
