import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as z from "zod/v4";
import type { ProjectDocument } from "../core/project-change.ts";

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

const destinationAction = z.object({
  type: z.enum(["navigate", "overlay"]),
  destinationScreenId: z.string().optional(),
});
const action = z.union([
  destinationAction,
  z.object({ type: z.literal("close-overlay") }),
  z.object({ type: z.literal("describe") }),
]);
const projectDocumentSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().nonnegative(),
  updatedAt: z.string().min(1),
  project: z.object({
    settings: z.object({
      screenPreset: z.enum(["mobile", "tablet", "desktop"]),
    }),
    screens: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string(),
        purpose: z.string(),
        kind: z.literal("popup").optional(),
        baseScreenId: z.string().optional(),
      }),
    ),
    elements: z.array(
      z.object({
        id: z.string().min(1),
        screenId: z.string().min(1),
        name: z.string(),
        description: z.string().optional(),
        type: z.enum([
          "text",
          "button",
          "input",
          "image",
          "divider",
          "section",
        ]),
        parentElementId: z.string().optional(),
        buttonVariant: z.enum(["filled", "outline"]).optional(),
        direction: z.enum(["vertical", "horizontal"]).optional(),
        role: z.literal("popup").optional(),
        order: z.number().optional(),
      }),
    ),
    features: z.array(
      z.object({
        id: z.string().min(1),
        screenId: z.string().min(1),
        name: z.string(),
        condition: z.string().optional(),
        description: z.string().optional(),
        trigger: z
          .union([
            z.object({ type: z.literal("click"), elementId: z.string() }),
            z.object({ type: z.literal("change"), elementId: z.string() }),
            z.object({
              type: z.literal("submit"),
              elementId: z.string().optional(),
            }),
          ])
          .optional(),
        action,
      }),
    ),
  }),
  figmaProjection: z
    .object({
      fileKey: z.string(),
      status: z.enum(["pending", "synced", "failed"]),
      lastSyncedRevision: z.number().int().optional(),
      nodes: z.record(z.string(), z.string()),
      lastError: z.string().optional(),
    })
    .optional(),
});
