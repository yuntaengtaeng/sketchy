import { createMcpHandler } from "@modelcontextprotocol/server";
import {
  ProjectService,
  ProjectServiceError,
  type ProjectPrincipal,
} from "../api/project-service.ts";
import { createSketchyMcpServer } from "./create-server.ts";
import { createSketchyAccountMcpServer } from "./account-server.ts";

export function createRemoteMcpHandler(
  service: ProjectService,
  principal: ProjectPrincipal,
  projectId?: string,
) {
  const resolveProjectId = async (id?: string) => {
    if (id) return id;
    const projects = await service.listProjects(principal);
    if (projects.length === 1) return projects[0].id;
    throw new ProjectServiceError(
      400,
      "PROJECT_SELECTION_REQUIRED",
      projects.length
        ? "Choose a project from list_projects."
        : "Connect a Figma project first.",
    );
  };
  return createMcpHandler(() =>
    projectId
      ? createSketchyMcpServer({
          getProject: () => service.getProject(principal, projectId),
          getScreen: (screenId) =>
            service.getScreen(principal, projectId, screenId),
          preview: (request) => service.preview(principal, projectId, request),
          apply: (previewId, request) =>
            service.apply(principal, projectId, previewId, request),
        })
      : createSketchyAccountMcpServer({
          listProjects: () => service.listProjects(principal),
          getProject: async (id) =>
            service.getProject(principal, await resolveProjectId(id)),
          getScreen: async (id, screenId) =>
            service.getScreen(principal, await resolveProjectId(id), screenId),
          preview: async (id, request) => {
            const resolved = await resolveProjectId(id);
            return service.preview(principal, resolved, {
              ...request,
              projectId: resolved,
            });
          },
          apply: async (id, previewId, request) => {
            const resolved = await resolveProjectId(id);
            return service.apply(principal, resolved, previewId, {
              ...request,
              projectId: resolved,
            });
          },
        }),
  );
}
