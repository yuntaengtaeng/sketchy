import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, dirname, join, resolve } from "node:path";
import type { ProjectDocument } from "../core/project-change.ts";
import { projectDocumentSchema } from "./schemas.ts";

export const DEFAULT_PROJECT_FILE = "sketchy.project.json";

export async function readProjectDocument(
  filePath = DEFAULT_PROJECT_FILE,
): Promise<ProjectDocument> {
  const absolutePath = resolve(filePath);
  let value: unknown;

  try {
    value = JSON.parse(await readFile(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read Sketchy project at ${absolutePath}.`, {
      cause: error,
    });
  }

  const document = projectDocumentSchema.safeParse(value);
  if (!document.success)
    throw new Error(`Invalid Sketchy project at ${absolutePath}.`);

  return document.data as ProjectDocument;
}

export async function writeProjectDocument(
  document: ProjectDocument,
  filePath = DEFAULT_PROJECT_FILE,
) {
  const absolutePath = resolve(filePath);
  const temporaryPath = join(
    dirname(absolutePath),
    `.${basename(absolutePath)}.${randomUUID()}.tmp`,
  );

  try {
    await writeFile(temporaryPath, JSON.stringify(document, null, 2), {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporaryPath, absolutePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw new Error(`Could not save Sketchy project at ${absolutePath}.`, {
      cause: error,
    });
  }
}
