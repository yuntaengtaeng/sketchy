# Remote MCP와 Sketchy API

Export 없이 Figma Plugin과 AI Agent가 같은 Project를 사용하기 위한 첫 원격
구조를 정의한다. 로컬 MCP의 도메인 Tool과 Batch 규칙은 그대로 유지한다.

## 현재와 미래 범위

- 현재: Figma Plugin의 Build·Flow·Spec은 일반 사용자도 로그인 없이 사용한다.
- 현재: Google 로그인, Project 최초 등록과 Codex용 Remote MCP OAuth를 구현했다.
- 현재: Plugin이 열려 있는 동안 Agent 변경과 Figma Canvas 편집을 양방향으로
  자동 동기화한다. `Apply to Figma`나 `Export` 같은 수동 단계는 없다.
- 개발자용: Local MCP는 Sketchy 저장소를 가진 개발자와 내부 검증에서만 사용한다.
- 미래: Free·Pro 제한은 아직 제품 기능으로 제공하지 않는다.

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

| Method | Path                                              | 역할                                                          |
| ------ | ------------------------------------------------- | ------------------------------------------------------------- |
| `POST` | `/api/v1/projects`                                | 기존 pluginData Project를 최초 한 번 연결                     |
| `GET`  | `/api/v1/projects/{projectId}`                    | Project, revision과 Screen 목록 조회 (Agent용 요약)           |
| `GET`  | `/api/v1/projects/{projectId}/document`           | elements·features를 포함한 전체 Document 조회 (Plugin pull용) |
| `PUT`  | `/api/v1/projects/{projectId}`                    | Figma Canvas 편집을 전체 Document로 반영 (Plugin push용)      |
| `GET`  | `/api/v1/projects/{projectId}/screens/{screenId}` | 한 Screen의 Element와 Feature 조회                            |
| `POST` | `/api/v1/projects/{projectId}/previews`           | Batch 검증, 저장하지 않음                                     |
| `POST` | `/api/v1/projects/{projectId}/changes`            | 승인된 Preview를 원자적으로 적용                              |
| `POST` | `/mcp?projectId={projectId}`                      | 동일한 네 MCP Tool 제공                                       |

`GET /{projectId}`는 Agent가 매 요청마다 읽기에 가볍도록 elements를 뺀 요약만
반환한다. Plugin의 poll도 이 요약만 조회해 revision을 비교하고, 실제로 반영할
때만 `/document`로 전체 내용을 받는다. `PUT`은 `POST /projects`와 같은 전체
Document Schema를 받지만 `revision`이 서버 현재값 + 1일 때만 허용하고, 그 외에는
Batch Apply와 동일하게 `409 REVISION_CONFLICT`를 반환한다.

Project 생성 이후 모든 요청의 path `projectId`, 인증 사용자, request의
`projectId`가 일치해야 한다. 알 수 없는 필드는 거절한다.

현재 `ProjectService`가 인증 사용자와 Scope, 소유권, revision 비교 및 기존
Preview/Apply 호출을 담당한다. 저장 구현은 `ProjectStore` 경계 뒤의 D1 Adapter가
담당한다. 플랫폼 중립 HTTP Adapter는 표준 `Request`와 `Response`를 사용하며
개발용 Bearer Token 인증과 위 API 경로를 제공한다.

`D1ProjectStore`는 Project 문서와 소유자, revision을 `projects` 테이블에 저장한다.
교체 쿼리는 기존 revision과 소유자가 모두 일치할 때만 성공한다. 로컬
마이그레이션은 `npm run d1:migrate:local`로 실행한다.

Worker는 `SKETCHY_API_TOKEN`, `SKETCHY_USER_ID` 환경값과 D1 `DB` binding으로
기존 HTTP API를 조립한다. 개발용 사용자 ID는 Wrangler 설정에 두고, 로컬에서는
Token을 `.dev.vars`에 넣은 뒤 `npm run dev:api`로 실행한다.

일반 사용자용 Remote MCP는 계정 단위 `/mcp` URL을 한 번만 등록한다.
`list_projects`로 연결된 Project를 찾으며, Project가 하나면 기본값으로 사용한다.
여러 개일 때만 Tool의 `projectId`로 대상을 고른다. 기존 `?projectId=` URL은
개발 검증과 이전 연결의 호환을 위해 유지한다.

### 배포와 smoke test 상태

2026-09-13에 `https://sketchy.dbsxo360.workers.dev`로 Worker를 배포했다.

- 원격 D1 `sketchy` binding과 migration을 적용했다.
- `SKETCHY_USER_ID=developer`와 Worker secret `SKETCHY_API_TOKEN`을 연결했다.
- Production URL은 Google OAuth와 고객용 API를 위해 공개하고, Preview는
  Cloudflare Access로 보호한다.
- 자동화 smoke test는 Access Service Token과 Worker Bearer Token을 함께 사용한다.
- 기존 Figma Project를 `POST /api/v1/projects`로 올리고 D1 조회까지 확인했다.

Service Token과 개발용 Bearer Token은 내부 검증용이다. 공개 Plugin에 넣거나
일반 사용자에게 설정하도록 요구하지 않는다.

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
Project ID와 동기화 상태(`sketchy:sync-state`)만 pluginData에 남기고 Plugin과
Agent 모두 API의 최신 revision을 읽는다.

```text
Plugin 최초 연결
→ 기존 Project 업로드
→ API Project ID 저장
→ 이후 API에서 읽기·쓰기
```

## 자동 양방향 동기화

Plugin이 열려 있는 동안 4초 간격으로 revision 요약을 poll하고,
`localRevision`·`remoteRevision`·`lastSyncedRevision` 세 값만으로 다음 행동을
정한다 (`src/plugin/sync-decision.ts`).

```text
로컬만 lastSynced보다 앞섬   → push
원격만 lastSynced보다 앞섬   → pull
둘 다 lastSynced보다 앞섬    → conflict, 아무 것도 하지 않음
```

```text
Agent Apply                         Figma Canvas 직접 편집
→ API revision 증가                  → documentchange 감지 (debounce)
→ Plugin poll이 revision 차이 감지    → PUT 전체 Document (revision = 현재 + 1)
→ GET /document로 전체 내용 조회      → 실패 시(주로 revision 충돌) 재시도하지 않고
→ 기존 Import 검증기로 Canvas 반영      다음 poll의 conflict 판정에 맡김
→ RECORD_FIGMA_PROJECTION으로
  Projection을 synced로 확인 기록
```

`RECORD_FIGMA_PROJECTION` 단독 배치는 Canonical Project를 바꾸지 않으므로
revision을 증가시키지 않는다. Pull 직후 이 확인 배치가 revision을 다시 올리면
Plugin이 자기 자신의 확인을 다시 pull 대상으로 오판하는 진동이 생기기 때문이다.

Plugin이 닫혀 있던 동안의 Agent 변경은 다음 실행의 첫 poll에서 즉시 pull한다.
로컬과 원격이 동시에 바뀌면(conflict) 어느 쪽도 자동으로 덮어쓰지 않고 Settings의
AI agents 영역에 상태만 표시한다 (`syncing` / `applied` / `conflict` /
`auth-expired`). `auth-expired`는 401·403 응답에서만 발생하며 Plugin이 자동으로
로그아웃해 재로그인을 유도한다.

## 인증 단계

내부 smoke test는 Worker secret과 비교하는 개발용 Bearer Token을 사용한다.
Figma Plugin의 Google 로그인과 Sketchy Session 발급을 구현했다. Codex Remote MCP는
Protected Resource Metadata, Authorization Server Metadata, Dynamic Client
Registration과 Authorization Code + PKCE를 사용한다.

- 내부 랜덤 `userId`에 Google의 안정적인 계정 식별자를 연결한다.
- OAuth Token에서 사용자 ID와 `project:read`, `project:write` 권한을 얻는다.
- Project 소유권은 인증 사용자 ID로 검사한다.
- Figma Token이나 다른 MCP Token을 전달하거나 저장하지 않는다.
- 개발용 Token은 외부 배포 전에 제거한다.
- 결제 고객 ID와 Free/Pro 상태는 로그인 제공자와 분리해 내부 `userId`에 연결한다.

인증 구현은 Adapter 책임이다. Project 문서에는 사용자 Token을 넣지 않는다.

`users`는 내부 랜덤 ID만 소유하고 `external_identities`가 Google의 변경되지 않는
`sub`를 사용자에게 연결한다. 이메일은 표시와 연락 정보이며 소유권 키로 사용하지
않는다. `sessions`에는 만료 시각과 불투명 Bearer Token의 SHA-256 해시만 저장한다.
Google access token과 refresh token은 Sketchy 세션 발급 후 보관하지 않는다.

Plugin 로그인은 다음 일회성 handoff를 사용한다.

```text
Plugin → POST /auth/plugin/start
Browser → GET /auth/google/start → Google
Google → GET /auth/google/callback
Plugin → POST /auth/plugin/session → Sketchy Session
```

Handoff는 10분 뒤 만료되고 polling secret이 일치할 때 한 번만 세션을 반환한다.
Google callback은 state와 HttpOnly·SameSite cookie를 함께 검사한다. Sketchy 세션은
30일 뒤 만료되며 Plugin의 사용자별 `clientStorage`에 저장한다.

일반 사용자는 Figma Plugin에서 Google로 로그인하고, MCP Client에는 URL만
등록한다. MCP Client가 브라우저 기반 승인과 PKCE를 처리하므로 Project ID,
Cloudflare Access, Service Token, Worker secret을 직접 입력하지 않는다. 고객용
Production 경로는 Cloudflare Access 좌석에 사용자를 등록하지 않으며 Access는
Preview와 관리자 경로 보호에만 사용한다.

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
- Google 외 로그인 제공자

이 항목은 실제 필요가 확인되면 추가한다. 다음 구현은 Google OAuth 로그인과
MCP OAuth 2.1 승인 흐름이다.
