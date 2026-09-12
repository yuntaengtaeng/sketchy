import * as z from "zod/v4";

const id = z.string().min(1).max(200);
const description = z.string().max(2000);
const action = z.discriminatedUnion("type", [
  z.object({ type: z.literal("navigate"), destinationScreenId: id }).strict(),
  z.object({ type: z.literal("overlay"), destinationScreenId: id }).strict(),
  z.object({ type: z.literal("close-overlay") }).strict(),
  z.object({ type: z.literal("describe") }).strict(),
]);
const screen = z
  .object({
    id,
    name: z.string().min(1).max(200),
    purpose: description,
    kind: z.literal("popup").optional(),
    baseScreenId: id.optional(),
  })
  .strict();
const element = z
  .object({
    id,
    screenId: id,
    name: z.string().min(1).max(200),
    description: description.optional(),
    type: z.enum(["text", "button", "input", "image", "divider", "section"]),
    parentElementId: id.optional(),
    buttonVariant: z.enum(["filled", "outline"]).optional(),
    direction: z.enum(["vertical", "horizontal"]).optional(),
    role: z.literal("popup").optional(),
    order: z.number().int().nonnegative().optional(),
  })
  .strict();
const nonEmptyPatch = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .strict()
    .refine((value) => Object.keys(value).length > 0, "Patch cannot be empty.");
const screenPatch = nonEmptyPatch({
  name: z.string().min(1).max(200).optional(),
  purpose: description.optional(),
});
const elementPatch = nonEmptyPatch({
  name: z.string().min(1).max(200).optional(),
  description: description.optional(),
  buttonVariant: z.enum(["filled", "outline"]).optional(),
  direction: z.enum(["vertical", "horizontal"]).optional(),
});
const featureCase = z
  .object({
    id,
    action,
    condition: z.string().min(1).max(2000),
    description: description.optional(),
  })
  .strict();
const featureCasePatch = nonEmptyPatch({
  action: action.optional(),
  condition: z.string().min(1).max(2000).optional(),
  description: description.optional(),
});
const projection = z
  .object({
    fileKey: z.string().min(1),
    status: z.enum(["pending", "synced", "failed"]),
    revision: z.number().int().nonnegative(),
    nodes: z.record(z.string(), id).optional(),
    error: z.string().max(4000).optional(),
  })
  .strict();

const change = z.discriminatedUnion("type", [
  z.object({ type: z.literal("CREATE_SCREEN"), screen }).strict(),
  z
    .object({
      type: z.literal("UPDATE_SCREEN"),
      screenId: id,
      patch: screenPatch,
    })
    .strict(),
  z.object({ type: z.literal("DELETE_SCREEN"), screenId: id }).strict(),
  z.object({ type: z.literal("ADD_ELEMENT"), element }).strict(),
  z
    .object({
      type: z.literal("UPDATE_ELEMENT"),
      elementId: id,
      patch: elementPatch,
    })
    .strict(),
  z.object({ type: z.literal("DELETE_ELEMENT"), elementId: id }).strict(),
  z
    .object({
      type: z.literal("SET_ELEMENT_ACTION"),
      featureId: id,
      elementId: id,
      action,
      description: description.optional(),
    })
    .strict(),
  z.object({ type: z.literal("CLEAR_ELEMENT_ACTION"), elementId: id }).strict(),
  z
    .object({
      type: z.literal("ADD_ELEMENT_CASE"),
      elementId: id,
      case: featureCase,
    })
    .strict(),
  z
    .object({
      type: z.literal("UPDATE_ELEMENT_CASE"),
      featureId: id,
      patch: featureCasePatch,
    })
    .strict(),
  z.object({ type: z.literal("REMOVE_ELEMENT_CASE"), featureId: id }).strict(),
  z
    .object({
      type: z.literal("RECORD_FIGMA_PROJECTION"),
      projection,
    })
    .strict(),
]);

export const projectChangeRequestSchema = z
  .object({
    projectId: id,
    baseRevision: z.number().int().nonnegative(),
    idempotencyKey: z.string().min(1).max(200),
    changes: z.array(change).min(1).max(200),
  })
  .strict();

export const applyProjectChangesSchema = projectChangeRequestSchema.extend({
  previewId: z.string().min(1).max(200),
});

const storedAction = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("navigate"),
    destinationScreenId: id.optional(),
  }),
  z.object({
    type: z.literal("overlay"),
    destinationScreenId: id.optional(),
  }),
  z.object({ type: z.literal("close-overlay") }),
  z.object({ type: z.literal("describe") }),
]);

export const projectDocumentSchema = z.object({
  id,
  revision: z.number().int().nonnegative(),
  updatedAt: z.string().min(1),
  project: z.object({
    settings: z.object({
      screenPreset: z.enum(["mobile", "tablet", "desktop"]),
    }),
    screens: z.array(screen),
    elements: z.array(element),
    features: z.array(
      z.object({
        id,
        screenId: id,
        name: z.string(),
        condition: z.string().optional(),
        description: z.string().optional(),
        trigger: z
          .discriminatedUnion("type", [
            z.object({ type: z.literal("click"), elementId: id }),
            z.object({ type: z.literal("change"), elementId: id }),
            z.object({ type: z.literal("submit"), elementId: id.optional() }),
          ])
          .optional(),
        action: storedAction,
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
  appliedBatches: z
    .record(
      z.string(),
      z.object({
        revision: z.number().int().nonnegative(),
        previewId: z.string(),
      }),
    )
    .optional(),
});
