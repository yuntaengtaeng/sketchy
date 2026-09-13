import { createMcpHandler } from "@modelcontextprotocol/server";
import type { ProjectPrincipal } from "../api/project-service.ts";
import { ProjectService } from "../api/project-service.ts";
import { createSketchyMcpServer } from "./create-server.ts";

export function createRemoteMcpHandler(
  service: ProjectService,
  principal: ProjectPrincipal,
  projectId: string,
) {
  return createMcpHandler(() =>
    createSketchyMcpServer({
      getProject: () => service.getProject(principal, projectId),
      getScreen: (screenId) =>
        service.getScreen(principal, projectId, screenId),
      preview: (request) => service.preview(principal, projectId, request),
      apply: (previewId, request) =>
        service.apply(principal, projectId, previewId, request),
    }),
  );
}
