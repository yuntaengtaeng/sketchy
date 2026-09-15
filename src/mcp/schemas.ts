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
const elementBase = {
  id,
  screenId: id,
  name: z.string().min(1).max(200),
  description: description.optional(),
  parentElementId: id.optional(),
  role: z.literal("popup").optional(),
  order: z.number().int().nonnegative().optional(),
};
const stringList = z.array(z.string().min(1).max(200)).max(100);
// 1~6 범위는 CountField가 UI에서 이미 강제하는 표시 취향일 뿐이라 서버까지
// 같은 상한을 걸면, 그 UI가 생기기 전에 저장된 값이나 클라이언트 버그로
// 범위를 벗어난 기존 데이터가 이후의 모든 push를 영원히 400으로 막는다
const repeatCount = z.number().int().positive().optional();
// Element도 action처럼 BlockType별 discriminated union, 각 variant가 실제로
// 갖는 필드만 허용해 서버가 도메인 타입과 같은 불가능한 조합을 거절한다
const element = z.discriminatedUnion("type", [
  z
    .object({
      ...elementBase,
      type: z.literal("text"),
      textSize: z
        .enum(["display", "title", "subtitle", "body", "caption"])
        .optional(),
    })
    .strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("button"),
      buttonVariant: z.enum(["filled", "outline"]).optional(),
    })
    .strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("input"),
      placeholder: z.string().max(200).optional(),
    })
    .strict(),
  z.object({ ...elementBase, type: z.literal("image") }).strict(),
  z.object({ ...elementBase, type: z.literal("divider") }).strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("section"),
      direction: z.enum(["vertical", "horizontal"]).optional(),
    })
    .strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("listItem"),
      itemType: z.enum(["basic", "leading", "trailing"]).optional(),
      count: repeatCount,
    })
    .strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("card"),
      cardType: z.enum(["basic", "media", "stat"]).optional(),
      count: repeatCount,
    })
    .strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("table"),
      columns: stringList.optional(),
      count: repeatCount,
    })
    .strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("tabs"),
      tabItems: stringList.optional(),
      selectedTab: z.string().max(200).optional(),
    })
    .strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("select"),
      options: stringList.optional(),
      displayState: z.enum(["collapsed", "expanded"]).optional(),
    })
    .strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("checkbox"),
      checked: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("radio"),
      checked: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      ...elementBase,
      type: z.literal("switch"),
      checked: z.boolean().optional(),
    })
    .strict(),
  z.object({ ...elementBase, type: z.literal("search") }).strict(),
]);
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
  z
    .object({
      type: z.literal("ADD_ELEMENT"),
      element,
      insertAfterElementId: id.optional(),
    })
    .strict(),
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
