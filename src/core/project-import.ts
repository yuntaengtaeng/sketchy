import { elementAncestors, elementTreeIds } from "../shared/element-tree.ts";
import type {
  DomainElement,
  DomainScreen,
  ProjectChange,
  ProjectDocument,
} from "./project-change.ts";
import { previewProjectChanges } from "./validate-project-changes.ts";
import type { ProjectImportPreview } from "../shared/index.ts";

export function previewProjectImport(
  current: ProjectDocument,
  contents: string,
): ProjectImportPreview {
  if (contents.length > 2_000_000)
    return invalid("Project file is larger than 2 MB.");

  let imported: unknown;
  try {
    imported = JSON.parse(contents);
  } catch {
    return invalid("Project file is not valid JSON.");
  }
  if (!isProjectDocument(imported))
    return invalid("File is not a Sketchy project.");
  if (imported.id !== current.id)
    return invalid("Project ID does not match this Figma document.");
  if (imported.revision <= current.revision)
    return invalid(`Imported revision must be newer than ${current.revision}.`);

  const summary = [
    ...collectionSummary(
      "screen",
      current.project.screens,
      imported.project.screens,
    ),
    ...collectionSummary(
      "element",
      current.project.elements,
      imported.project.elements,
    ),
    ...collectionSummary(
      "action",
      current.project.features,
      imported.project.features,
      ["name"],
    ),
  ];
  const errors = supportedImportErrors(current, imported);
  return {
    valid: errors.length === 0,
    revision: imported.revision,
    summary: summary.length ? summary : ["No model changes"],
    errors,
    warnings:
      imported.figmaProjection?.status === "pending"
        ? []
        : ["The imported project is not marked pending for Figma."],
  };
}

function supportedImportErrors(
  current: ProjectDocument,
  imported: ProjectDocument,
) {
  const errors: string[] = [];
  const currentScreenIds = new Set(
    current.project.screens.map((item) => item.id),
  );
  const importedScreenIds = new Set(
    imported.project.screens.map((item) => item.id),
  );
  const removedScreens = current.project.screens.filter(
    (item) => !importedScreenIds.has(item.id),
  );
  const removedScreenIds = new Set(removedScreens.map((item) => item.id));
  const removedScreenRoots = removedScreens.filter(
    (screen) =>
      !screen.baseScreenId || !removedScreenIds.has(screen.baseScreenId),
  );
  if (
    removedScreenRoots.some((screen) =>
      imported.project.screens.some(
        (other) => other.baseScreenId === screen.id,
      ),
    ) ||
    imported.project.elements.some((element) =>
      removedScreenIds.has(element.screenId),
    )
  )
    errors.push(
      "Deleting a screen must include its popup screens and elements.",
    );
  if (hasUnsupportedScreenChange(current, imported))
    errors.push("Screen type changes are not supported.");
  const addedScreens = imported.project.screens.filter(
    (item) => !currentScreenIds.has(item.id),
  );
  if (addedScreens.some((screen) => screen.kind || screen.baseScreenId))
    errors.push("Adding popup screens is not supported yet.");
  const currentElementIds = new Set(
    current.project.elements.map((item) => item.id),
  );
  const importedElementIds = new Set(
    imported.project.elements.map((item) => item.id),
  );
  const removedElements = current.project.elements.filter(
    (item) =>
      !importedElementIds.has(item.id) && !removedScreenIds.has(item.screenId),
  );
  const removedElementIds = new Set(removedElements.map((item) => item.id));
  const removedRoots = removedElements.filter(
    (item) =>
      !item.parentElementId || !removedElementIds.has(item.parentElementId),
  );
  if (
    removedRoots.some((root) =>
      imported.project.elements.some((element) =>
        elementTreeIds(current.project.elements, root.id).has(element.id),
      ),
    )
  )
    errors.push("Deleting a section must include its nested elements.");
  if (hasUnsupportedElementChange(current, imported))
    errors.push("Element structure or type changes are not supported.");
  const actions = importedActionChanges(current, imported);
  errors.push(...actions.errors);
  errors.push(
    ...addedProjectErrors(
      current,
      addedScreens.filter((screen) => !screen.kind && !screen.baseScreenId),
      imported.project.elements.filter(
        (item) => !currentElementIds.has(item.id),
      ),
      imported.project.elements,
      actions.changes,
      removedRoots.map((element) => element.id),
      removedScreenRoots.map((screen) => screen.id),
    ),
  );
  if (
    JSON.stringify(stableValue(current.project.settings)) !==
    JSON.stringify(stableValue(imported.project.settings))
  )
    errors.push("Project setting changes are not supported yet.");
  return errors;
}

function importedActionChanges(
  current: ProjectDocument,
  imported: ProjectDocument,
): { changes: ProjectChange[]; errors: string[] } {
  const before = new Map(
    current.project.features.map((feature) => [feature.id, feature]),
  );
  const errors: string[] = [];
  const changes: ProjectChange[] = [];
  for (const feature of current.project.features) {
    if (imported.project.features.some((other) => other.id === feature.id))
      continue;
    const destinationId =
      "destinationScreenId" in feature.action
        ? feature.action.destinationScreenId
        : undefined;
    const removedWithEntity =
      (!!feature.trigger?.elementId &&
        !imported.project.elements.some(
          (element) => element.id === feature.trigger?.elementId,
        )) ||
      (!!destinationId &&
        !imported.project.screens.some(
          (screen) => screen.id === destinationId,
        ));
    if (removedWithEntity) continue;
    if (!feature.trigger?.elementId) {
      errors.push("Only a button's default action can be changed for now.");
      continue;
    }
    changes.push(
      feature.condition
        ? { type: "REMOVE_ELEMENT_CASE", featureId: feature.id }
        : {
            type: "CLEAR_ELEMENT_ACTION",
            elementId: feature.trigger.elementId,
          },
    );
  }

  for (const feature of imported.project.features) {
    const previous = before.get(feature.id);
    const fields = previous ? changedFields(previous, feature, ["name"]) : [];
    if (previous && !fields.length) continue;
    const isCase = !!feature.condition?.trim();
    const wasCase = !!previous?.condition?.trim();
    const source = imported.project.elements.find(
      (element) => element.id === feature.trigger?.elementId,
    );
    if (
      feature.trigger?.type !== "click" ||
      !feature.trigger.elementId ||
      !source ||
      feature.screenId !== source.screenId ||
      (previous &&
        fields.some(
          (field) =>
            field !== "action" &&
            field !== "condition" &&
            field !== "description",
        )) ||
      (previous && isCase !== wasCase) ||
      (!previous &&
        !isCase &&
        current.project.features.some(
          (item) =>
            !item.condition &&
            item.trigger?.elementId === feature.trigger?.elementId,
        ))
    ) {
      errors.push("Only a button's default action can be changed for now.");
      continue;
    }
    if (isCase) {
      changes.push(
        previous
          ? {
              type: "UPDATE_ELEMENT_CASE",
              featureId: feature.id,
              patch: {
                action: feature.action,
                condition: feature.condition,
                description: feature.description,
              },
            }
          : {
              type: "ADD_ELEMENT_CASE",
              elementId: feature.trigger.elementId,
              case: {
                id: feature.id,
                action: feature.action,
                condition: feature.condition!,
                description: feature.description,
              },
            },
      );
      continue;
    }
    changes.push({
      type: "SET_ELEMENT_ACTION",
      featureId: feature.id,
      elementId: feature.trigger.elementId,
      action: feature.action,
      description: feature.description,
    });
  }
  return { changes, errors: [...new Set(errors)] };
}

function hasUnsupportedScreenChange(
  current: ProjectDocument,
  imported: ProjectDocument,
) {
  const before = new Map(
    current.project.screens.map((item) => [item.id, item]),
  );
  return imported.project.screens.some((item) => {
    const previous = before.get(item.id);
    return previous
      ? changedFields(previous, item).some(
          (field) => field !== "name" && field !== "purpose",
        )
      : false;
  });
}

function hasUnsupportedElementChange(
  current: ProjectDocument,
  imported: ProjectDocument,
) {
  const allowed = new Set([
    "name",
    "description",
    "buttonVariant",
    "direction",
  ]);
  const before = new Map(
    current.project.elements.map((item) => [item.id, item]),
  );
  return imported.project.elements.some((item) => {
    const previous = before.get(item.id);
    return previous
      ? changedFields(previous, item).some((field) => !allowed.has(field))
      : false;
  });
}

function addedProjectErrors(
  current: ProjectDocument,
  screens: DomainScreen[],
  added: DomainElement[],
  allElements: DomainElement[],
  actions: ProjectChange[],
  removedElementIds: string[],
  removedScreenIds: string[],
) {
  if (
    !screens.length &&
    !added.length &&
    !actions.length &&
    !removedElementIds.length &&
    !removedScreenIds.length
  )
    return [];
  const elements = [...added]
    .sort(
      (left, right) =>
        elementAncestors(allElements, left).length -
        elementAncestors(allElements, right).length,
    )
    .map((element) => ({ type: "ADD_ELEMENT" as const, element }));
  return previewProjectChanges(current, {
    projectId: current.id,
    baseRevision: current.revision,
    idempotencyKey: "project-import",
    changes: [
      ...screens.map((screen) => ({ type: "CREATE_SCREEN" as const, screen })),
      ...removedScreenIds.map((screenId) => ({
        type: "DELETE_SCREEN" as const,
        screenId,
      })),
      ...removedElementIds.map((elementId) => ({
        type: "DELETE_ELEMENT" as const,
        elementId,
      })),
      ...elements,
      ...actions,
    ],
  }).errors.map((issue) => issue.message);
}

function changedCollection(
  current: { id: string }[],
  imported: { id: string }[],
  ignoredFields: string[] = [],
) {
  const before = new Map(current.map((item) => [item.id, item]));
  return imported.some((item) => {
    const previous = before.get(item.id);
    return !previous || changedFields(previous, item, ignoredFields).length > 0;
  });
}

function collectionSummary(
  label: string,
  current: { id: string; name?: string }[],
  imported: { id: string; name?: string }[],
  ignoredFields: string[] = [],
) {
  const before = new Map(current.map((item) => [item.id, item]));
  const after = new Map(imported.map((item) => [item.id, item]));
  const added = imported.filter((item) => !before.has(item.id)).length;
  const removed = current.filter((item) => !after.has(item.id)).length;
  const updated = imported.flatMap((item) => {
    const previous = before.get(item.id);
    if (!previous) return [];
    const fields = changedFields(previous, item, ignoredFields);
    return fields.length
      ? [`Update ${label} ${previous.name || item.id}: ${fields.join(", ")}`]
      : [];
  });
  return [
    added && `Add ${added} ${label}${added === 1 ? "" : "s"}`,
    ...updated,
    removed && `Remove ${removed} ${label}${removed === 1 ? "" : "s"}`,
  ].filter((item): item is string => !!item);
}

function changedFields(
  current: Record<string, unknown>,
  imported: Record<string, unknown>,
  ignoredFields: string[] = [],
) {
  return [...new Set([...Object.keys(current), ...Object.keys(imported)])]
    .filter((key) => key !== "id" && !ignoredFields.includes(key))
    .filter(
      (key) =>
        JSON.stringify(stableValue(current[key])) !==
        JSON.stringify(stableValue(imported[key])),
    );
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stableValue(item)]),
  );
}

function invalid(message: string): ProjectImportPreview {
  return { valid: false, summary: [], errors: [message], warnings: [] };
}

function isProjectDocument(value: unknown): value is ProjectDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<ProjectDocument>;
  const project = document.project;
  return (
    typeof document.id === "string" &&
    Number.isInteger(document.revision) &&
    document.revision! >= 0 &&
    typeof document.updatedAt === "string" &&
    !!project &&
    Array.isArray(project.screens) &&
    Array.isArray(project.elements) &&
    Array.isArray(project.features) &&
    uniqueIds(project.screens) &&
    uniqueIds(project.elements) &&
    uniqueIds(project.features) &&
    project.screens.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.purpose === "string" &&
        (item.kind === undefined || item.kind === "popup") &&
        (item.baseScreenId === undefined ||
          typeof item.baseScreenId === "string"),
    ) &&
    project.elements.every(isElement) &&
    project.features.every(isFeature)
  );
}

function uniqueIds(items: unknown[]) {
  const ids = items.map((item) =>
    item && typeof item === "object" && "id" in item ? item.id : undefined,
  );
  return (
    ids.every((id) => typeof id === "string") &&
    new Set(ids).size === ids.length
  );
}

function isElement(item: unknown) {
  if (!item || typeof item !== "object") return false;
  const element = item as Record<string, unknown>;
  return (
    typeof element.id === "string" &&
    typeof element.screenId === "string" &&
    typeof element.name === "string" &&
    ["text", "button", "input", "image", "divider", "section"].includes(
      element.type as string,
    ) &&
    (element.description === undefined ||
      typeof element.description === "string") &&
    (element.buttonVariant === undefined ||
      element.buttonVariant === "filled" ||
      element.buttonVariant === "outline") &&
    (element.direction === undefined ||
      element.direction === "vertical" ||
      element.direction === "horizontal")
  );
}

function isFeature(item: unknown) {
  if (!item || typeof item !== "object") return false;
  const feature = item as Record<string, unknown>;
  const trigger = feature.trigger as Record<string, unknown> | undefined;
  return (
    typeof feature.id === "string" &&
    typeof feature.screenId === "string" &&
    typeof feature.name === "string" &&
    (feature.condition === undefined ||
      typeof feature.condition === "string") &&
    (feature.description === undefined ||
      typeof feature.description === "string") &&
    (trigger === undefined ||
      ((trigger.type === "click" ||
        trigger.type === "change" ||
        trigger.type === "submit") &&
        (trigger.elementId === undefined ||
          typeof trigger.elementId === "string"))) &&
    isAction(feature.action)
  );
}

function isAction(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const action = value as Record<string, unknown>;
  if (action.type === "describe" || action.type === "close-overlay")
    return true;
  return (
    (action.type === "navigate" || action.type === "overlay") &&
    (action.destinationScreenId === undefined ||
      typeof action.destinationScreenId === "string")
  );
}
