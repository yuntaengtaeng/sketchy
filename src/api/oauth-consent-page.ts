export function renderOAuthConsentPage({
  params,
  projectId,
  clientName,
}: {
  params: URLSearchParams;
  projectId: string | null;
  clientName: string | null;
}) {
  const agent = escapeHtml(clientName || "AI agent");
  const fields = [...params]
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Connect ${agent} · Sketchy</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; font: 15px/1.5 Inter, system-ui, sans-serif; color: #202020; background: #f5f3ee; }
    main { width: min(100%, 420px); padding: 32px; border: 1px solid #202020; background: #fff; box-shadow: 8px 8px 0 #202020; }
    h1 { margin: 0 0 12px; font-size: 24px; }
    p { margin: 0 0 24px; color: #606060; }
    code { display: block; margin: -12px 0 24px; overflow-wrap: anywhere; font-size: 12px; color: #606060; }
    button { width: 100%; min-height: 44px; border: 1px solid #202020; background: #202020; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
    button:hover { background: #444; }
    button:focus-visible { outline: 2px dashed #202020; outline-offset: 3px; }
  </style>
</head>
<body>
  <main>
    <h1>Connect ${agent}</h1>
    <p>Allow ${agent} to read and update your Sketchy projects?</p>
    ${projectId ? `<code>${escapeHtml(projectId)}</code>` : ""}
    <form method="post">${fields}<button name="decision" value="allow">Allow access</button></form>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
