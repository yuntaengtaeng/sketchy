# Remote MCP와 Sketchy API

Export 없이 Figma Plugin과 AI Agent가 같은 Project를 사용하기 위한 첫 원격
구조를 정의한다. 로컬 MCP의 도메인 Tool과 Batch 규칙은 그대로 유지한다.

## 초기 배포 결정

초기 검증은 무료 범위에서 시작한다.

```text
Cloudflare Worker
├─ /api/v1/*  Figma Plugin용 HTTP API
└─ /mcp       Codex·Claude용 Streamable HTTP

Cloudflare D1
└─ Project document + owner + revision
```

- Worker 하나가 API와 MCP 전송을 함께 제공한다.
- D1은 Canonical Project를 저장한다.
- Cloudflare 전용 코드는 HTTP와 저장 Adapter에만 둔다.
- Core의 Project, Preview, Apply와 Validation은 Cloudflare를 import하지 않는다.
- 호스팅을 바꿔도 HTTP 계약을 유지하면 Plugin과 MCP Tool은 바꾸지 않는다.

## 최소 HTTP 계약

개별 Screen이나 Element CRUD를 만들지 않는다. 기존 Batch 계약을 그대로 사용한다.

| Method | Path                                              | 역할                                      |
| ------ | ------------------------------------------------- | ----------------------------------------- |
| `POST` | `/api/v1/projects`                                | 기존 pluginData Project를 최초 한 번 연결 |
| `GET`  | `/api/v1/projects/{projectId}`                    | Project, revision과 Screen 목록 조회      |
| `GET`  | `/api/v1/projects/{projectId}/screens/{screenId}` | 한 Screen의 Element와 Feature 조회        |
| `POST` | `/api/v1/projects/{projectId}/previews`           | Batch 검증, 저장하지 않음                 |
| `POST` | `/api/v1/projects/{projectId}/changes`            | 승인된 Preview를 원자적으로 적용          |
| `POST` | `/mcp`                                            | 동일한 네 MCP Tool 제공                   |

Project 생성 이후 모든 요청의 path `projectId`, 인증 사용자, request의
`projectId`가 일치해야 한다. 알 수 없는 필드는 거절한다.

현재 `ProjectService`가 인증 사용자와 Scope, 소유권, revision 비교 및 기존
Preview/Apply 호출을 담당한다. 저장 구현은 `ProjectStore` 경계 뒤에 있으며 다음
단계에서 D1 Adapter를 연결한다.

### 원자적 Apply

Apply는 D1 트랜잭션 안에서 다음 순서를 지킨다.

1. 인증 사용자가 Project 소유자 또는 허용된 사용자인지 확인한다.
2. 저장된 revision과 `baseRevision`을 비교한다.
3. Preview ID와 Batch를 다시 검증한다.
4. Project 전체를 저장하고 revision을 한 번 증가시킨다.
5. 같은 idempotency key 재호출은 같은 성공 결과를 반환한다.

revision이 다르면 `409 REVISION_CONFLICT`를 반환하며 일부 변경은 저장하지 않는다.

## Export 제거 흐름

최초 연결 때만 Plugin의 기존 `pluginData` Project를 API에 올린다. 이후에는
Project ID만 pluginData에 남기고 Plugin과 Agent 모두 API의 최신 revision을 읽는다.

```text
Plugin 최초 연결
→ 기존 Project 업로드
→ API Project ID 저장
→ 이후 API에서 읽기·쓰기

Agent Apply
→ API revision 증가
→ Plugin에서 변경 검토
→ Figma Canvas 반영
→ Projection synced 기록
```

Plugin이 닫힌 동안 Figma에서 직접 바꾼 내용은 다음 Plugin 실행 때 기존 원칙대로
먼저 정리한 후 API Batch로 반영한다. revision 충돌 시 사용자 Canvas를 자동으로
덮어쓰지 않는다.

## 인증 단계

내부 smoke test에서는 Worker secret과 비교하는 개발용 Bearer Token 하나를 쓴다.
외부 사용자를 받기 전에는 OAuth로 교체한다.

- 토큰에서 사용자 ID와 `project:read`, `project:write` 권한을 얻는다.
- Project 소유권은 인증 사용자 ID로 검사한다.
- Figma Token이나 다른 MCP Token을 전달하거나 저장하지 않는다.
- 개발용 Token은 외부 배포 전에 제거한다.

인증 구현은 Adapter 책임이다. Project 문서에는 사용자 Token을 넣지 않는다.

## Free와 Pro 확장 경계

유료 Plan을 Project 도메인에 넣지 않는다. 소유권, 사용량, 결제 상태를 분리한다.

```text
Project         ownerId로 접근 제어
Usage           사용자별 월 Apply 횟수
Entitlement     Free/Pro 한도 판단
Billing Adapter 외부 결제 상태 변환
```

초기에는 소유권만 저장한다. 실제 사용 근거가 생긴 뒤 다음 순서로 추가한다.

1. 성공한 Apply만 사용자별·월별로 집계한다.
2. Free의 활성 Project 수와 월 Apply 한도를 정한다.
3. 결제 서비스 상태를 내부 Free/Pro 권한으로 변환한다.
4. Apply 직전에 한도를 검사하고 초과 시 명확한 오류를 반환한다.

Preview와 조회 호출은 Agent가 내부적으로 여러 번 실행할 수 있으므로 과금 단위로
삼지 않는다. 결제 제공자가 바뀌어도 Billing Adapter만 교체한다.

## 지금 만들지 않는 것

- 결제 연동과 가격
- 팀 Project와 멤버 역할
- 실시간 공동 편집
- 무제한 변경 이력
- Cloudflare 외 플랫폼 Adapter
- 외부 사용자용 OAuth 구현

이 항목은 내부 Remote MCP smoke test가 끝난 뒤 실제 필요가 확인되면 추가한다.
