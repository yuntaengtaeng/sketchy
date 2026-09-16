import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectDocument } from "../src/core/project-change.ts";
import {
  confirmProjectionSynced,
  fetchRemoteDocument,
  fetchRemoteRevision,
  pushProject,
} from "../src/plugin/commands/remote-sync.ts";

const session = { token: "tok", user: { id: "u", email: "u@test.dev" } };
const document: ProjectDocument = {
  id: "project",
  revision: 2,
  updatedAt: "2026-09-13T00:00:00.000Z",
  project: {
    settings: { screenPreset: "mobile", showFlowArrows: true },
    screens: [],
    elements: [],
    features: [],
  },
};

test("reads the remote revision through an authenticated GET", async () => {
  let seen: Request | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    seen = new Request(input as string, init);
    return new Response(JSON.stringify({ revision: 5 }));
  };
  const result = await fetchRemoteRevision(session, "project", fetcher);
  assert.deepEqual(result, { ok: true, value: 5 });
  assert.equal(
    seen?.url,
    "https://sketchy.dbsxo360.workers.dev/api/v1/projects/project",
  );
  assert.equal(seen?.headers.get("authorization"), "Bearer tok");
});

test("reports the HTTP status instead of throwing when the revision check fails", async () => {
  const fetcher: typeof fetch = async () => new Response(null, { status: 401 });
  assert.deepEqual(await fetchRemoteRevision(session, "project", fetcher), {
    ok: false,
    status: 401,
  });
});

test("fetches the full document from the dedicated endpoint", async () => {
  let seen: Request | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    seen = new Request(input as string, init);
    return new Response(JSON.stringify(document));
  };
  const result = await fetchRemoteDocument(session, "project", fetcher);
  assert.deepEqual(result, { ok: true, value: document });
  assert.equal(
    seen?.url,
    "https://sketchy.dbsxo360.workers.dev/api/v1/projects/project/document",
  );
});

test("pushes the local document as a PUT and reports the saved revision", async () => {
  let seen: Request | undefined;
  let body: string | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    seen = new Request(input as string, init);
    body = init?.body as string;
    return new Response(JSON.stringify({ revision: 3 }));
  };
  const result = await pushProject(session, document, fetcher);
  assert.deepEqual(result, { ok: true, value: 3 });
  assert.equal(seen?.method, "PUT");
  assert.equal(seen?.headers.get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(body!), document);
});

test("reports 409 on a conflicting push instead of throwing", async () => {
  const fetcher: typeof fetch = async () => new Response(null, { status: 409 });
  assert.deepEqual(await pushProject(session, document, fetcher), {
    ok: false,
    status: 409,
  });
});

test("confirms a projection through a preview then apply round trip", async () => {
  const seen: Request[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const request = new Request(input as string, init);
    seen.push(request);
    if (seen.length === 1)
      return new Response(JSON.stringify({ previewId: "p1", valid: true }));
    return new Response(JSON.stringify({ applied: true }));
  };
  const nodes = { checkout: "1:2" };
  const confirmed = await confirmProjectionSynced(
    session,
    "project",
    2,
    "figma-file",
    nodes,
    fetcher,
  );
  assert.equal(confirmed, true);
  assert.equal(seen.length, 2);
  assert.ok(seen[0].url.endsWith("/api/v1/projects/project/previews"));
  assert.ok(seen[1].url.endsWith("/api/v1/projects/project/changes"));
  const applyBody = JSON.parse(await seen[1].clone().text());
  assert.equal(applyBody.previewId, "p1");
  assert.deepEqual(applyBody.changes[0], {
    type: "RECORD_FIGMA_PROJECTION",
    projection: {
      fileKey: "figma-file",
      status: "synced",
      revision: 2,
      nodes,
    },
  });
});

test("does not apply the projection when the preview comes back invalid", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({ previewId: "p1", valid: false }));
  };
  const confirmed = await confirmProjectionSynced(
    session,
    "project",
    2,
    "figma-file",
    {},
    fetcher,
  );
  assert.equal(confirmed, false);
  assert.equal(calls, 1);
});
