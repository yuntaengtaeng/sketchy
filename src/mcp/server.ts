import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { readProjectDocument } from "./project-file.ts";
import { getProject, getScreen } from "./read-tools.ts";

const projectFile = projectFileArgument(process.argv.slice(2));

void serveStdio(() => {
  const server = new McpServer(
    { name: "sketchy", version: "0.1.0" },
    {
      instructions:
        "Read the Sketchy project before proposing wireframe changes. This server is read-only.",
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
