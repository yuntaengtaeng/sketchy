import assert from "node:assert/strict";
import test from "node:test";

import { renderOAuthConsentPage } from "../src/api/oauth-consent-page.ts";

test("renders escaped OAuth consent values", () => {
  const html = renderOAuthConsentPage({
    params: new URLSearchParams({ state: '"><script>bad()</script>' }),
    projectId: "project-1",
    clientName: "<Claude>",
  });

  assert.match(html, /Connect &lt;Claude&gt;/);
  assert.doesNotMatch(html, /<script>bad/);
  assert.match(html, /Allow access/);
});
