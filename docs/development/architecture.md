# 기술 설계

## 제품 결정

Figma 파일이 Sketchy의 유일한 원본이다.

Sketchy는 Figma 플러그인 안에서 다음 기능만 제공한다.

- low-fi Screen과 UI Block 생성·편집
- Interaction과 Figma Prototype 연결
- Flow 시각화
- 현재 문서에서 계산한 Spec과 Markdown/Text 내보내기

다음 계층은 제품 범위에 두지 않는다.

- Sketchy 계정과 Google OAuth
- 자체 서버, Worker, D1과 원격 Project 저장소
- 자체 MCP 서버와 외부 AI용 Figma 브리지
- 원격 revision 동기화와 충돌 해결
- Project JSON Export/Import

외부 AI 기능이 필요하면 사용자가 Figma가 공식 제공하는 Agent/MCP 기능을 별도로 사용한다. Sketchy는 이를 중계하거나 별도의 원격 원본을 만들지 않는다.

## Source of truth

Canvas Node와 파일에 저장된 Sketchy plugin data가 같은 Figma 파일 안에서 함께 동작한다.

- Screen과 Element의 실제 배치·존재 여부는 Canvas가 기준이다.
- Sketchy의 의미 정보는 `figma.root.setPluginData("sketchy:project", ...)`에 저장한다.
- 각 Sketchy Node는 Screen/Element ID를 plugin data로 가진다.
- 파일 복제, 버전 기록, 권한, 공유와 기기 간 접근은 Figma가 담당한다.
- 계정, 서버 Project ID, revision, sync cursor는 만들지 않는다.

## Runtime 경계

```text
React UI
  ↕ typed PluginMessage / UiMessage
Figma Plugin Main
  ├─ Canvas 명령
  ├─ Project plugin data
  ├─ Prototype / Flow 반영
  └─ documentchange 정합성 보정
```

- React UI는 입력과 표시만 담당하고 `figma.*`를 호출하지 않는다.
- Plugin Main만 Canvas와 plugin data를 읽고 쓴다.
- `shared`는 직렬화 가능한 모델과 메시지 계약을 제공한다.
- `core`는 런타임 API에 의존하지 않는 검증만 제공한다.

## documentchange의 역할

`documentchange`는 원격 동기화를 위한 기능이 아니다. 사용자가 Figma에서 직접 바꾼 현재 파일을 Sketchy UI와 맞추기 위한 로컬 보정 장치다.

이 이벤트에서 하는 일은 다음으로 제한한다.

- 삭제된 Screen/Element를 Project에서 제거
- Canvas에서 바꾼 이름과 요소 순서를 Project에 반영
- Screen 이동 후 Flow 선을 다시 계산
- Figma 네이티브 복사로 중복된 Sketchy Element ID가 생긴 경우 진단 로그 기록

네이티브 복사본을 자동으로 새 Sketchy Element로 등록하지 않는다. 새 요소 생성은 Sketchy UI 명령을 통해서만 수행한다. 복사 동작의 제품 지원이 필요해질 때 별도 UX와 ID 재발급 규칙을 설계한다.

## 저장과 변경 흐름

1. UI가 typed message를 보낸다.
2. Plugin Main이 Canvas 명령을 실행한다.
3. 변경된 Project를 현재 Figma 파일의 plugin data에 저장한다.
4. Prototype 또는 Flow가 영향을 받으면 같은 파일 안에서 다시 그린다.
5. 최신 Project와 selection을 UI로 보낸다.

서버 호출, polling, push/pull, revision 비교는 없다.
