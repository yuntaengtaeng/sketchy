---
name: sketchy-api-worker
description: Apply Sketchy-specific Worker HTTP, authentication, OAuth, D1, ownership, revision, and persistence principles when changing or reviewing src/api, src/worker.ts, migrations, or remote API behavior.
---

# Sketchy API Worker

`sketchy-code-style`을 먼저 적용한다. HTTP·인증·저장 계약은 `docs/development/remote-mcp.md`를 기준으로 한다.

## Scope

`src/api`, `src/worker.ts`, `migrations`, Worker route, 인증, OAuth, D1, Project 원격 저장에 적용한다. Project 변경 의미는 `core`, MCP Tool 표현은 `src/mcp`의 책임이다.

## 필수 원칙

1. **모든 외부 입력을 불신한다.** path, query, header, cookie, JSON, OAuth redirect를 검증하고 알 수 없는 JSON 필드는 거절한다.
2. **인증·scope·소유권을 함께 지킨다.** path/request Project ID와 principal/owner를 service에서 확인하고 타인 Project의 존재 여부를 노출하지 않는다.
3. **비밀을 노출하지 않는다.** bearer token, OAuth code, polling secret, session token을 로그·응답·Project document에 넣지 않는다. 필요한 token은 hash와 만료만 저장한다.
4. **OAuth 방어를 완화하지 않는다.** state, PKCE, redirect URI, 일회 사용, expiry를 검증하고 인증 실패를 retry나 넓은 권한으로 우회하지 않는다.
5. **revision 비교와 write는 원자적이어야 한다.** read 후 무조건 write하지 않으며 경쟁 변경은 `409 REVISION_CONFLICT`로 전체 실패시킨다.
6. **idempotency를 보존한다.** 같은 key와 같은 Apply는 같은 성공 결과를 반환하고 다른 요청의 key 재사용은 거절한다.
7. **client 저장 상태를 신뢰하지 않는다.** 전체 문서 push에서도 서버의 `appliedBatches`와 ownership 정보를 유지한다.
8. **migration은 append-only다.** 이미 적용된 migration을 수정하지 않고 새 migration으로 진화시킨다.

## 책임 경계

- Worker는 표준 `Request`/`Response`, binding, route를 조립한다.
- HTTP adapter는 입력을 parsing하고 예상 가능한 service 오류만 안정적인 status/code로 변환한다.
- `ProjectService`는 scope, ownership, identity, revision과 Preview/Apply orchestration을 담당한다.
- `ProjectStore`는 저장 경계이며 D1 SQL과 Cloudflare 타입을 adapter 밖으로 노출하지 않는다.
- 요약과 전체 document 조회 차이를 보존하고 poll 경로에 전체 document를 싣지 않는다.
- 알 수 없는 오류의 message나 stack을 client에 노출하지 않는다.

## 검증

- route 변경은 가까운 API test에서 status, code, body를 검증한다.
- 인증/OAuth 변경은 성공과 함께 만료, 재사용, 잘못된 state/scope/owner 중 영향받는 경계를 검증한다.
- 저장 변경은 경쟁 write, idempotency, atomic failure 중 영향받는 불변식을 검증한다.
- D1 변경은 실제 adapter 쿼리와 migration test를 통과시켜 service mock만으로 대체하지 않는다.

## 배포

이 프로젝트에는 CI/CD가 없다(`.github/workflows` 없음, `package.json`에
`deploy` script 없음) — `git push`는 Cloudflare Worker를 배포하지 않는다.
`src/api`, `src/worker.ts`, `src/mcp`, `migrations` 중 하나라도 커밋하면
**바로 이어서** `npx wrangler deploy`를 실행한다(사용자에게 묻지 않고
자동으로). `src/plugin`, `src/ui`, `src/shared`, `src/core`만 바뀐
커밋은 배포 대상이 아니다 — 플러그인은 사용자가 Figma에서 다시 로드해야
반영된다.

