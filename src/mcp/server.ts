import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { applyChanges, previewChanges } from "./change-tools.ts";
import { createSketchyMcpServer } from "./create-server.ts";
import { readProjectDocument, writeProjectDocument } from "./project-file.ts";
import { getProject, getScreen } from "./read-tools.ts";

const projectFile = projectFileArgument(process.argv.slice(2));

void serveStdio(() =>
  createSketchyMcpServer({
    async getProject() {
      return getProject(await readProjectDocument(projectFile));
    },
    async getScreen(screenId) {
      return getScreen(await readProjectDocument(projectFile), screenId);
    },
    async preview(request) {
      return previewChanges(await readProjectDocument(projectFile), request);
    },
    async apply(previewId, request) {
      const applied = applyChanges(
        await readProjectDocument(projectFile),
        previewId,
        request,
      );
      if (applied.nextDocument)
        await writeProjectDocument(applied.nextDocument, projectFile);
      return applied.result;
    },
  }),
);

function projectFileArgument(args: string[]) {
  const index = args.indexOf("--project");
  if (index < 0) return process.env.SKETCHY_PROJECT_FILE;
  if (!args[index + 1]) throw new Error("--project needs a file path.");
  return args[index + 1];
}
