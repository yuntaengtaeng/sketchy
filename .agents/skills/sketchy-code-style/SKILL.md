---
name: sketchy-code-style
description: Apply Sketchy's repository-wide TypeScript, dependency-boundary, error-handling, and test principles for every coding or code-review task in this repository.
---

# Sketchy Code Style

모든 코딩 작업에 먼저 적용한다. 런타임별 판단은 specialist Skill로 보강하고, 충돌하면 이 Skill을 우선한다.

## 작업 전

- `docs/README.md`에서 변경 영역의 기준 문서를 찾아 필요한 문서만 읽는다.
- 호출부와 데이터 흐름을 따라 실제 책임 경계를 확인한 뒤 수정한다.
- 요청 범위 밖의 기존 코드를 일괄 정리하지 않는다.

## 필수 원칙

1. **도메인 규칙은 한 곳에 둔다.** Project 타입, validation, 변경 의미는 `src/core` 또는 `src/shared`의 순수 TypeScript에 두고 UI, Plugin, API, MCP에서 복제하지 않는다.
2. **의존성은 runtime에서 core로만 향한다.** 브라우저, Figma, Node, Cloudflare 전용 API가 core/shared로 역류하지 않게 한다.
3. **타입을 우회하지 않는다.** `any`, 무근거 type assertion, non-null assertion을 추가하지 않는다. 외부 입력은 경계에서 검증하고 좁힌다.
4. **불가능한 상태를 표현하지 않는다.** 유한한 variant와 비동기 상태는 충돌 가능한 flag 조합보다 discriminated union을 우선한다.
5. **오류를 삼키지 않는다.** 복구 가능한 경계에서만 안정적인 오류로 변환하고 secret·token·내부 stack을 노출하지 않는다.
6. **데이터 안전성을 줄이지 않는다.** validation, 인증, 접근 제어, revision, required error handling을 편의를 위해 생략하지 않는다.
7. **비자명한 로직에는 집중 검사를 남긴다.** branch, parser, validation, 동시성, 데이터 변경은 가까운 test에서 외부 결과나 불변식을 검증한다.

## 구현 기준

- 같은 사실은 하나의 원본만 소유한다. 기존 타입, helper, 도메인 함수를 먼저 재사용한다.
- public 함수와 경계 타입은 의미가 드러나는 이름을 쓴다. 자명한 내부 값에는 불필요한 타입 주석을 붙이지 않는다.
- 기존 타입과 관계있는 타입은 `Pick`, `Omit`, `Extract` 등으로 관계를 보존한다.
- guard clause로 실패를 먼저 처리하고 정상 흐름의 중첩을 줄인다.
- 도메인 조건은 `is`, `has`, `can`, `should` 이름이나 작은 함수로 표현한다. 단순 위임 wrapper는 만들지 않는다.
- ESM과 현재 import 관례를 따르고 로컬 TypeScript import의 `.ts` 확장자를 유지한다.
- 주석은 동작 설명보다 비자명한 계약과 이유를 기록한다.
- unrelated responsibility가 누적되면 새 분기 전에 가장 작은 유용한 단위로 나눈다.

## 완료 조건

- source 변경 뒤 `npm run format`, `npm run check`, `npm run build`를 실행한다.
- 관련 좁은 테스트를 먼저 실행하고 handoff 전 전체 필수 검증을 완료한다.
- `git diff --check`와 `git status --short`로 우발적 생성물과 범위 밖 변경을 확인한다.

