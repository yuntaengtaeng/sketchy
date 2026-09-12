import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { applyChanges, previewChanges } from "./change-tools.ts";
import { readProjectDocument } from "./project-file.ts";
import { getProject, getScreen } from "./read-tools.ts";
import {
  applyProjectChangesSchema,
  projectChangeRequestSchema,
} from "./schemas.ts";

const projectFile = projectFileArgument(process.argv.slice(2));

void serveStdio(() => {
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
    async () => result(getProject(await readProjectDocument(projectFile))),
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
    async ({ screenId }) =>
      result(getScreen(await readProjectDocument(projectFile), screenId)),
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
      result(
        previewChanges(
          await readProjectDocument(projectFile),
          request as Parameters<typeof previewChanges>[1],
        ),
      ),
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
      result(
        await applyChanges(
          projectFile,
          previewId,
          request as Parameters<typeof applyChanges>[2],
        ),
      ),
  );

  return server;
});

function result(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}

function projectFileArgument(args: string[]) {
  const index = args.indexOf("--project");
  if (index < 0) return process.env.SKETCHY_PROJECT_FILE;
  if (!args[index + 1]) throw new Error("--project needs a file path.");
  return args[index + 1];
}
