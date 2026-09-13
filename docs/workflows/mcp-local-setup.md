# 로컬 MCP 시작하기

현재 로컬 MCP는 개발 검증용이다. `build`와 `manifest.json`만 받은 Plugin
사용자는 실행할 수 없으며, Sketchy 저장소와 `npm install`이 필요하다. 일반 사용자용
연동은 이후 Sketchy API 기반 Remote MCP에서 제공한다.

## 준비

1. 저장소에서 `npm install`을 실행한다.
2. Figma에서 Sketchy Plugin을 열고 Settings로 이동한다.
3. `Export for Codex or Claude`를 눌러 저장소 루트에
   `sketchy.project.json`으로 저장한다.

Windows 경로는 `C:/Users/name/sketchy`처럼 슬래시를 사용한다.

## Codex에 연결

```powershell
codex.cmd mcp add sketchy -- npm.cmd --prefix C:/path/to/sketchy run mcp -- --project C:/path/to/sketchy/sketchy.project.json
codex.cmd mcp list
```

등록 후 새 Codex 세션을 열고 다음처럼 시작한다.

> Sketchy 현재 프로젝트를 읽고 화면과 흐름을 요약해줘.

## Claude Code에 연결

```powershell
claude.cmd mcp add --scope user sketchy -- cmd /c npm.cmd --prefix C:/path/to/sketchy run mcp -- --project C:/path/to/sketchy/sketchy.project.json
claude.cmd mcp list
```

등록 후 새 Claude Code 세션을 열고 Codex와 같은 요청을 사용한다. Windows PowerShell의
실행 정책이 `claude.ps1`을 막으면 `claude` 대신 `claude.cmd`를 사용한다.

## Claude Desktop에 연결

Claude Desktop의 Developer Settings에서 설정 파일을 열고 `mcpServers`에 추가한다.

```json
{
  "mcpServers": {
    "sketchy": {
      "command": "cmd",
      "args": [
        "/c",
        "npm.cmd",
        "--prefix",
        "C:/path/to/sketchy",
        "run",
        "mcp",
        "--",
        "--project",
        "C:/path/to/sketchy/sketchy.project.json"
      ]
    }
  }
}
```

저장 후 Claude Desktop을 다시 실행한다.

## 변경 적용

먼저 Agent에게 변경안을 만들되 Apply하지 말라고 요청한다.

> 첫 화면에 Outline 버튼을 추가하는 변경안을 Preview해줘. Apply는 하지 마.

요약과 경고를 확인한 뒤 적용을 요청한다.

> 오류와 경고가 없으면 Apply해줘.

MCP Apply는 JSON Project만 변경한다. Figma Plugin에서 다음 순서로 Canvas에 반영한다.

1. `Review agent changes`에서 `sketchy.project.json` 선택
2. 변경 요약 확인
3. `Apply to Figma`
4. `Export for Codex or Claude`로 동기화 완료

Figma Project가 Agent 변경보다 최신이면 적용이 차단된다. 이때
`Export latest project`를 누른 뒤 새 Agent 세션에서 변경안을 다시 만든다.
