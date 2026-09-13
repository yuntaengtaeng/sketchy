# Sketchy 로그인 UX 검토

## 결론

독립적으로 판단하면 **선택지 B를 추천**한다.

다만 단순히 `Connect AI agent`를 눌렀을 때만 로그인을 요구하는 것보다,  
**Sketchy가 서버를 사용해야 하는 최초 순간에 로그인을 요구하는 B+ 형태**가 가장 적절하다.

핵심 원칙은 다음과 같다.

> **로그인 전 = Figma 안에서 Sketchy의 핵심 가치를 충분히 체험**  
> **로그인 후 = 저장·동기화·AI Agent·과금처럼 사용자 계정이 필요한 기능 활성화**

즉, 사용자가 Sketchy를 써보기 위해 로그인하는 것이 아니라  
**Sketchy를 Cloud·다중 기기·AI Agent와 연결하기 위해 로그인하도록 만드는 것**이 좋다.

---

# 1. Figma Plugin 사용자에게 로그인은 언제 요구하는 것이 자연스러운가?

가장 자연스러운 시점은 다음 기준으로 판단할 수 있다.

> **사용자가 기대하는 동작을 수행하기 위해 계정이 실제로 필요한 순간**

예를 들어 다음 기능은 로그인 이유가 없다.

- Screen 생성
- UI Block 생성
- Feature 정의
- Flow 연결
- Spec 확인
- Canvas에 결과 반영
- 로컬 상태 저장

반대로 다음 기능은 계정 필요성을 이해하기 쉽다.

- AI Agent 연결
- Cloud Project 생성
- Cloud Sync
- 다른 기기에서 Project 복구
- Codex·Claude가 Project 읽기
- Agent 변경안 제출
- Agent Apply
- Project 공유

첫 실행 직후 로그인 화면을 보여주면 사용자는 먼저 다음을 생각한다.

> 왜 로그인이 필요하지?

반면 `Connect AI agent`, `Sync`, `Save to Sketchy Cloud` 같은 기능을 사용하려는 순간 로그인 요청이 나타나면 다음처럼 받아들이기 쉽다.

> 외부 서비스와 연결하고 서버에 저장해야 하니 계정이 필요한 거구나.

따라서 로그인 시점은 **첫 실행이 아니라 Cloud Boundary를 넘어가는 시점**이 좋다.

---

# 2. A / B / C 중 어떤 방식을 추천하는가?

| 방식                                   | 평가            | 이유                                                         |
| -------------------------------------- | --------------- | ------------------------------------------------------------ |
| A. 첫 실행 로그인 필수                 | 비추천          | 제품 가치를 경험하기 전에 신뢰와 개인정보 제공을 먼저 요구함 |
| **B. 로컬 사용 후 필요한 순간 로그인** | **추천**        | 체험 → 가치 인식 → 로그인 순서가 자연스러움                  |
| C. 익명 사용자 ID + 일부 서버 기능     | 비추천에 가까움 | 계정 병합, 복구, 권한, 사용량, 결제 상태 관리가 복잡해짐     |

추천 구조는 B를 조금 확장한 형태다.

## Local

계정 없이 사용한다.

- Build
- Flow
- Spec
- Local Preview
- Local Project

## Cloud

계정이 필요하다.

- Cloud Project
- Cloud Sync
- AI Agent 연결
- Project 복구
- 다중 기기 동기화
- Remote Preview
- Agent Apply
- 공유 및 협업

즉, Agent 연결 자체가 경계가 아니라 **Cloud 기능 전체가 로그인 경계**가 되어야 한다.

---

# 3. 로그인 전후 기능 경계

## 로그인 없이 제공

- Screen 생성
- Block 생성
- Screen 편집
- Feature 정의
- Interaction 설정
- Flow 확인
- Spec 확인
- Canvas 반영
- 기본 Preview
- 로컬 Project 저장

가능하면 여기에 인위적인 사용량 제한을 두지 않는 것이 좋다.

예를 들어 다음 제한은 권장하지 않는다.

- Block 20개 제한
- Screen 5개 제한
- Feature 10개 제한

사용자는 이런 제한을 서버 비용과 연결해서 이해하기 어렵다.

> 내 Figma 안에서 Block 하나 더 만드는 게 왜 유료지?

라는 반응이 나올 가능성이 높다.

## 로그인 후 제공

- Sketchy Cloud Project 생성
- Cloud Sync
- 다른 기기에서 복구
- AI Agent 연결
- MCP Authorization
- Agent Proposal 수신
- Remote Preview
- Agent Apply
- 향후 공유 / 협업

이 경계는 사용자가 이해하기 쉽다.

```text
Account
  ↓
Cloud Project
  ↓
AI Agent
  ↓
Sync / Recovery / Apply
```

---

# 4. 버튼 이름과 안내 문구

사용자가 원하는 것은 로그인 자체가 아니다.

따라서 UI에서는 `Login`을 전면에 내세우기보다  
**사용자가 하려는 행동을 먼저 보여주고 로그인은 그 행동의 중간 단계로 배치**하는 것이 좋다.

## Agent 영역

```text
Connect AI agent

Use Codex or Claude with this Sketchy project.

[ Connect AI agent ]
```

클릭 후:

```text
Sign in to continue

Sketchy needs an account to securely connect this project
with your AI agent and keep changes in sync.

[ Continue with Google ]

You can keep using Build, Flow and Spec without signing in.
```

특히 다음 문구가 중요하다.

> You can keep using Build, Flow and Spec without signing in.

로그인 화면이 벽이 아니라 선택지처럼 느껴진다.

## 권장 용어

계정:

```text
Sign in to Sketchy
```

Google 버튼:

```text
Continue with Google
```

AI:

```text
Connect AI agent
```

Cloud:

```text
Enable cloud sync
```

또는

```text
Sync with Sketchy
```

## 피하고 싶은 용어

- Authorize
- Authenticate
- OAuth
- Connect MCP server
- Create remote project

이 표현들은 구현자 중심 용어다.

사용자에게는 가능한 한 숨기는 것이 좋다.

---

# 5. Google OAuth는 첫 인증 수단으로 적절한가?

초기 인증 수단으로 적절하다.

Sketchy의 주요 사용자는 대체로 다음 범주에 해당한다.

- PM
- PO
- Designer
- Developer
- AI Coding Tool 사용자

이 사용자층은 Google 계정을 이미 가지고 있을 가능성이 높다.

또한 Sketchy가 직접 비밀번호를 관리하지 않아도 되므로 계정 복구와 보안 부담도 줄어든다.

다만 매우 중요한 점이 있다.

## Google 로그인과 Google 데이터 접근은 구분해야 한다

사용자는 다음 버튼을 눌렀는데

```text
Continue with Google
```

갑자기 Google Drive나 Docs 접근 권한까지 요구하면 불신할 가능성이 높다.

초기 로그인에서는 가능한 최소 scope만 요청하는 것이 좋다.

즉 초기 Google OAuth는 다음 역할만 해야 한다.

```text
Google = Identity Provider
```

Google Drive, Docs 등 별도의 데이터 접근이 필요하다면  
향후 해당 기능을 사용하는 순간 별도 권한으로 요청하는 편이 좋다.

---

# 6. 로그인 과정에서 예상되는 이탈·불신·혼란

## 6.1 Figma → 브라우저 전환

Plugin 인증은 다음 흐름이 될 가능성이 높다.

```text
Sketchy Plugin
  ↓
Browser
  ↓
Google Login
  ↓
Sketchy 인증 완료
  ↓
Figma로 복귀
```

가장 위험한 순간은 인증 이후다.

사용자가 다음 상태가 되면 안 된다.

> 로그인을 했는데 이제 뭘 해야 하지?

웹 완료 페이지:

```text
You're connected to Sketchy.

Return to Figma to continue.

[ Return to Figma ]
```

Plugin:

```text
Waiting for sign-in…
```

↓

```text
✓ Signed in as user@example.com
Connecting your project…
```

처럼 상태 연결이 명확해야 한다.

---

## 6.2 Google로 무엇을 가져가는지 불명확함

사용자는 OAuth scope를 기술적으로 해석하지 않는다.

로그인 직전에 간단한 설명을 주는 것이 좋다.

```text
Sketchy uses your Google account only to identify your Sketchy account.

We don't access your Google Drive or Figma files through Google.
```

실제 구현과 개인정보 처리 정책도 반드시 이 설명과 일치해야 한다.

---

## 6.3 로그인 후 기존 Project가 사라지는 느낌

예를 들어 사용자가 로그인 전에 다음을 만들었다고 가정한다.

```text
Screen 8개
Feature 20개
Flow 14개
```

로그인 후 새로운 빈 Cloud Project가 만들어지면 사용자는 기존 작업이 사라졌다고 느낄 수 있다.

따라서 로그인은 Migration보다 **Attach** 개념이 적절하다.

```text
Local Project
   ↓ Sign in
Attach to account
   ↓
Cloud Project
```

사용자에게는 다음 정도가 자연스럽다.

```text
Save this project to Sketchy Cloud?
```

---

## 6.4 다른 기기에서 Project가 보이지 않음

로그인 기능을 제공하면 사용자는 자연스럽게 다음을 기대한다.

> 다른 PC에서도 이 Project가 보이겠지?

Cloud Account를 제공한다면  
로그인된 Project는 복구 가능한 자산이라는 기대를 충족시키는 것이 좋다.

그렇지 않다면 로그인 자체가 오히려 혼란을 만든다.

---

# 7. Free / Pro 제한을 Block이 아니라 Remote Project와 Agent Apply에 두는 것이 타당한가?

타당하다.

좋은 Paywall은 사용자가 비용이 발생하는 이유를 이해할 수 있어야 한다.

## Block 제한

```text
Rectangle
Button
Input
Screen
```

이런 로컬 요소에 제한을 두면 사용자는 다음처럼 느낄 수 있다.

> 내 Figma 안에 있는 데이터인데 왜 Sketchy가 제한하지?

## Agent Apply 제한

반면 Agent 기능은 다음 흐름을 가진다.

```text
Claude / Codex
   ↓
Project Read
   ↓
Proposal
   ↓
Preview
   ↓
Apply
   ↓
Sync
```

사용자는 자연스럽게 이해할 수 있다.

> AI 기능이고 서버를 쓰니까 사용량 제한이 있구나.

## Remote Project 제한

Cloud Project 수도 마찬가지다.

> Cloud에 저장하는 활성 Project 수가 제한되는구나.

라는 설명이 쉽다.

예:

```text
Local Workspace
Unlimited

Free
- 2 active cloud projects
- 20 Agent Applies / month

Pro
- More cloud projects
- More Agent Applies
```

---

# 8. Preview와 조회는 과금 횟수에서 제외하는 것이 좋은가?

좋다.

Sketchy의 중요한 UX가 다음이라면:

```text
Agent proposes
   ↓
Human reviews
   ↓
Human approves
```

검토 과정에 과금 압박을 주지 않는 것이 중요하다.

Preview까지 과금하면 사용자는 다음 행동을 하게 될 수 있다.

- Preview를 덜 본다
- 검토 없이 Apply한다
- 사용량을 아끼기 위해 확인 단계를 건너뛴다

이는 Sketchy가 제공하려는 안전한 AI 변경 흐름과 충돌한다.

따라서 다음을 권장한다.

- Read: 무료
- Preview: 무료
- Proposal 확인: 무료
- 실제 Apply: 사용량 차감

---

# 9. 선택지 C가 생각보다 복잡한 이유

Anonymous Server User는 초기 진입에는 좋아 보일 수 있다.

```text
anonymous user
  ↓
server 사용
  ↓
나중에 account 연결
```

하지만 실제로는 다음 문제가 생긴다.

```text
anonymousUser123
  ├─ project A
  └─ project B

Google login
  ↓

existing user456
```

이때 해결해야 할 문제:

- Project 병합
- Quota 병합
- Agent Apply 사용량 병합
- 결제 상태
- Anonymous MCP Token
- Device A / Device B
- 기존 계정 존재 여부
- 충돌 Project 이름
- 소유권 이전

UX 관점에서도 사용자가 다음처럼 느낄 수 있다.

> 나는 가입한 적이 없는데 왜 서버에 내 Project가 저장되어 있지?

Sketchy처럼 디자인 파일과 AI Agent를 다루는 제품에서는  
**명시적으로 Cloud 사용에 동의하고 Account를 만드는 방식이 더 신뢰하기 쉽다.**

추천:

```text
Anonymous Local
   ↓
Explicit Account
```

비추천:

```text
Anonymous Server Account
   ↓
Account Migration
```

---

# 10. 더 단순하면서 안전한 대안

A / B / C보다는 제품 자체를 다음처럼 정의하는 것이 좋다.

# Local-first Account Model

```text
                 Sketchy
                    │
           ┌────────┴────────┐
           │                 │
        Local              Cloud
           │                 │
      No Account          Account
           │                 │
   Build / Flow           Sync
   Spec / Preview         AI Agent
                          Sharing
                          Recovery
```

Plugin 어딘가에 작은 상태 표시를 둘 수 있다.

```text
Local
```

클릭:

```text
This project is stored locally.

Sign in to:
• connect AI agents
• sync across devices
• recover your project

[ Sign in ]
```

로그인 여부가 단순한 계정 상태가 아니라  
Sketchy의 데이터 저장 방식과 연결된 개념으로 이해된다.

---

# 11. 첫 사용자부터 Pro 전환까지 권장 UX 흐름

## Step 1 — 첫 실행

로그인 화면을 보여주지 않는다.

```text
Welcome to Sketchy

Turn your Figma screens into
flows, specs and AI-ready projects.

[ Start building ]
```

---

## Step 2 — 첫 Screen 생성

사용자가 바로 다음 행동을 수행한다.

```text
+ Screen
```

Canvas에서 실제 결과를 경험한다.

첫 번째로 받아야 하는 것은 Email이 아니라  
**첫 성공 경험**이다.

---

## Step 3 — Build / Flow / Spec 경험

사용자는 자연스럽게 다음 기능을 사용한다.

```text
Build
Flow
Spec
```

여전히 로그인은 없다.

---

## Step 4 — AI Agent 발견

Plugin 안에 다음 영역이 보인다.

```text
AI Agent

Connect Codex or Claude
to work with this project.

[ Connect AI agent ]
```

---

## Step 5 — Connect AI agent 클릭

이 시점에 처음 로그인을 요구한다.

```text
Connect your Sketchy account

Signing in lets Sketchy securely connect
this project to Codex or Claude and keep
changes synchronized.

[ Continue with Google ]

Build, Flow and Spec remain available
without an account.
```

사용자가 로그인 이유를 충분히 이해할 수 있다.

---

## Step 6 — 브라우저 OAuth

```text
Sketchy
Continue with Google
```

최소한의 Identity Permission만 요청한다.

---

## Step 7 — 인증 완료

브라우저:

```text
You're connected.

Return to Figma to continue.
```

Plugin:

```text
✓ Signed in

This project is now connected to Sketchy Cloud.
```

기존 Local Project는 그대로 Cloud Project와 연결된다.

---

## Step 8 — Agent 연결

```text
Choose how you want to work

Codex
[ Connect ]

Claude
[ Connect ]
```

여기서 실제 MCP OAuth를 진행한다.

Sketchy Account 로그인과 Agent Authorization은 가능한 한 별개의 단계로 보여주는 것이 좋다.

한 흐름에 모두 섞으면 다음처럼 느껴질 수 있다.

```text
Google
→ Sketchy
→ MCP
→ Claude
→ Browser
→ Permission
```

인증 단계가 너무 많아 보인다.

---

## Step 9 — 첫 Agent Proposal

Agent가 변경안을 생성한다.

```text
Claude proposed 3 changes

[ Preview ]
```

Preview는 무료.

이후:

```text
[ Apply changes ]
```

Apply를 실행한 시점부터 Free Usage를 차감한다.

---

## Step 10 — Free 사용

평소에는 Usage Count를 지나치게 강조하지 않는다.

예를 들어 70~80% 사용 시점 정도에 보여준다.

```text
You're approaching your Free plan limit.

16 / 20 Agent Applies
```

---

## Step 11 — Paywall

한도 도달:

```text
You've used your 20 Agent Applies this month.

Your projects and previews remain available.

[ Upgrade to Pro ]
[ Continue without Agent Apply ]
```

중요한 점은 무료 한도에 도달하더라도 Sketchy 전체가 잠긴 느낌을 주지 않는 것이다.

다음 기능은 계속 사용할 수 있다.

- Build
- Flow
- Spec
- 기존 Project
- Preview
- 조회

---

## Step 12 — Pro

다음 표현보다는:

```text
Unlock Sketchy
```

다음과 같은 메시지가 적절하다.

```text
Work with more projects and AI changes
```

즉 Pro는 Sketchy 자체의 잠금을 해제하는 것이 아니라  
**Cloud 및 AI 작업 규모를 확장하는 Plan**으로 보여야 한다.

---

# 12. `figma.clientStorage`와 과금

`figma.clientStorage`는 로컬 UX 상태에 사용하는 것은 좋지만  
권한이나 과금의 Source of Truth로 사용하면 안 된다.

## 저장해도 좋은 것

- 최근 탭
- UI Preference
- 마지막 선택 Screen
- 사용자 튜토리얼 확인 여부
- Local Project 상태
- 로그인 관련 비민감 로컬 상태

## 서버에서 관리해야 하는 것

- Agent Apply Count
- Subscription
- Free / Pro Entitlement
- Cloud Project Limit
- Payment Customer ID
- Project Ownership

특히 다음과 같은 Local Limit은 보안 경계가 될 수 없다.

```text
Block Count
Agent Apply Count
Subscription
```

로컬 스토리지는 초기화나 재설치로 우회 가능하기 때문이다.

---

# 최종 추천 구조

```text
Sketchy Local
────────────────
Build
Flow
Spec
Local Preview
Unlimited local content

        ↓ Sign in when needed

Sketchy Cloud — Free
────────────────
Cloud Projects
AI Agent connection
Cross-device recovery
Limited Agent Apply

        ↓ Upgrade when needed

Sketchy Pro
────────────────
More Cloud Projects
More Agent Apply
Collaboration / Team features
```

최종적으로 Sketchy의 로그인 UX는 다음 한 문장으로 설명할 수 있어야 한다.

> **Sketchy를 써보기 위해 로그인하지 않는다.  
> Sketchy를 다른 기기·Cloud·AI Agent와 연결하기 위해 로그인한다.**

Sketchy는 Figma 안에서 먼저 사용자가 직접 결과물을 만들 수 있는 제품이다.

따라서 **첫 로그인보다 첫 Screen 생성이 먼저 일어나는 것이 좋다.**

사용자가 먼저

> 이 Plugin 쓸 만하다.

라고 느낀 뒤 계정을 요구하는 편이  
진입 마찰, 신뢰, 전환, 계정 복구, 다중 기기 사용 모두에서 더 자연스럽다.
