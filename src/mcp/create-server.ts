import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { ProjectChangeRequest } from "../core/project-change.ts";
import {
  applyProjectChangesSchema,
  projectChangeRequestSchema,
} from "./schemas.ts";

export type ProjectAccess = {
  getProject(): Promise<unknown>;
  getScreen(screenId: string): Promise<unknown>;
  preview(request: ProjectChangeRequest): Promise<unknown>;
  apply(previewId: string, request: ProjectChangeRequest): Promise<unknown>;
};

export function createSketchyMcpServer(project: ProjectAccess) {
  const server = new McpServer(
    { name: "sketchy", version: "0.1.0" },
    {
      instructions:
        "Read the project first. Preview every change batch, show its summary and warnings, and call apply_project_changes only after explicit user approval. Applying changes updates the Sketchy model but not the Figma canvas.",
    },
  );

  server.registerTool(
    "get_project",
    {
      title: "Get Sketchy project",
      description:
        "Get the current revision, settings, screen list, and Figma projection status.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => result(await project.getProject()),
  );

  server.registerTool(
    "get_screen",
    {
      title: "Get Sketchy screen",
      description:
        "Get one screen with its elements, features, and known Figma node mappings.",
      inputSchema: z.object({ screenId: z.string().min(1) }),
      annotations: { readOnlyHint: true },
    },
    async ({ screenId }) => result(await project.getScreen(screenId)),
  );

  server.registerTool(
    "preview_project_changes",
    {
      title: "Preview Sketchy project changes",
      description:
        "Validate an atomic batch against the current project revision without saving it.",
      inputSchema: projectChangeRequestSchema,
      annotations: { readOnlyHint: true },
    },
    async (request) =>
      result(await project.preview(request as ProjectChangeRequest)),
  );

  server.registerTool(
    "apply_project_changes",
    {
      title: "Apply Sketchy project changes",
      description:
        "Atomically save the exact batch returned by preview_project_changes.",
      inputSchema: applyProjectChangesSchema,
    },
    async ({ previewId, ...request }) =>
      result(await project.apply(previewId, request as ProjectChangeRequest)),
  );

  return server;
}

function result(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}
