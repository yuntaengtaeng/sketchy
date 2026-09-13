import assert from "node:assert/strict";
import test from "node:test";

import {
  createDevelopmentBearerAuthenticator,
  createProjectApi,
} from "../src/api/http.ts";
import {
  ProjectService,
  type ProjectRecord,
  type ProjectStore,
} from "../src/api/project-service.ts";

const record: ProjectRecord = {
  ownerId: "developer",
  document: {
    id: "project",
    revision: 3,
    updatedAt: "2026-09-13T00:00:00.000Z",
    project: {
      settings: { screenPreset: "mobile" },
      screens: [{ id: "home", name: "Home", purpose: "Start" }],
      elements: [],
      features: [],
    },
  },
};

test("serves the Project API through development Bearer authentication", async () => {
  const store: ProjectStore = {
    async create() {
      return false;
    },
    async get(projectId) {
      return projectId === record.document.id ? record : undefined;
    },
    async replace() {
      return true;
    },
  };
  const api = createProjectApi(
    new ProjectService(store),
    createDevelopmentBearerAuthenticator("secret", "developer"),
  );

  const unauthorized = await api(
    new Request("https://sketchy.test/api/v1/projects/project"),
  );
  assert.equal(unauthorized.status, 401);
  assert.equal((await unauthorized.json()).error.code, "UNAUTHORIZED");

  const project = await api(
    new Request("https://sketchy.test/api/v1/projects/project", {
      headers: { authorization: "Bearer secret" },
    }),
  );
  assert.equal(project.status, 200);
  assert.equal((await project.json()).revision, 3);

  const invalid = await api(
    new Request("https://sketchy.test/api/v1/projects/project/previews", {
      method: "POST",
      headers: {
        authorization: "Bearer secret",
        "content-type": "application/json",
      },
      body: JSON.stringify({ projectId: "project", unexpected: true }),
    }),
  );
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, "INVALID_REQUEST");
});
