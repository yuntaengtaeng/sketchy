# Figma Plugin Runtime Boundaries

## 기본 모델

Figma Plugin Main과 React UI를 하나의 React 애플리케이션처럼 취급하지 않는다.

```text
Plugin Main                         React UI
-----------                         --------
figma.* API                         rendering
Document / SceneNode                user input
selection                           UI state
plugin data             <------>    browser-side interaction when applicable
canvas mutation          message    loading/error/confirmation UI
```

네트워크 요청 위치는 인증 정보, Figma API 제약, 배포 런타임과 기존 모듈 경계를 기준으로 정한다. Main이나 UI 한쪽의 고정 책임으로 일반화하지 않는다. Figma API 지원 범위는 현재 manifest와 공식 Figma 문서를 기준으로 확인한다.

## Node는 DTO로 변환

피해야 할 방향:

```ts
interface Props {
  node: SceneNode;
}
```

권장:

```ts
interface NodeSummary {
  nodeId: string;
  name: string;
  type: string;
}
```

실제 Node가 필요할 때 Main에서 ID로 다시 조회한다. UI/서버의 domain entity ID와 Figma node ID가 다른 개념이라면 타입/이름으로 구분한다.

## Message는 protocol이다

```ts
type PluginCommand =
  | { type: 'screen/create'; payload: CreateScreenInput }
  | { type: 'screen/select'; payload: { screenId: string } };

type PluginEvent =
  | { type: 'selection/changed'; payload: SelectionSnapshot }
  | { type: 'project/changed'; payload: ProjectSnapshot };
```

- UI → Main: command/request
- Main → UI: event/result
- payload는 직렬화 가능한 데이터만 사용
- `any`와 임의 문자열 message type 확산 금지
- 새 message를 추가할 때 송신/수신 타입 계약을 함께 변경

## Error 경계

동일 JS 런타임 내부에서는 custom Error를 사용할 수 있다.

```ts
class ProjectConflictError extends Error {}
```

하지만 Main ↔ UI 메시지 경계에서는 prototype/class identity를 전제로 하지 않는다. 오류를 데이터 계약으로 변환한다.

```ts
type PluginErrorPayload =
  | {
      type: 'PROJECT_CONFLICT';
      message: string;
    }
  | {
      type: 'NODE_NOT_FOUND';
      message: string;
      nodeId: string;
    };
```

UI는 `instanceof`가 아니라 `type`을 기준으로 UX를 결정한다.

## Review questions

- 이 로직은 Figma document를 다루는가, UI를 다루는가?
- UI가 Figma 런타임 객체를 보관하고 있지 않은가?
- message payload가 serializable한가?
- command/event 방향과 이름만 보고 의도를 알 수 있는가?
- 경계를 넘는 Error를 class identity로 판별하고 있지 않은가?
