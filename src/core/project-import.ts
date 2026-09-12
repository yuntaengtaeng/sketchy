import type { ProjectDocument } from "./project-change.ts";
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
  const sameIds = (left: { id: string }[], right: { id: string }[]) =>
    left.length === right.length &&
    left.every((item) => right.some((other) => other.id === item.id));
  if (!sameIds(current.project.screens, imported.project.screens))
    errors.push("Adding or removing screens is not supported yet.");
  if (!sameIds(current.project.elements, imported.project.elements))
    errors.push("Adding or removing elements is not supported yet.");
  else if (hasUnsupportedElementChange(current, imported))
    errors.push("Element structure or type changes are not supported.");
  if (
    !sameIds(current.project.features, imported.project.features) ||
    changedCollection(current.project.features, imported.project.features, [
      "name",
    ])
  )
    errors.push("Action changes are not supported yet.");
  if (
    JSON.stringify(stableValue(current.project.settings)) !==
    JSON.stringify(stableValue(imported.project.settings))
  )
    errors.push("Project setting changes are not supported yet.");
  return errors;
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
  return imported.project.elements.some((item) =>
    changedFields(before.get(item.id)!, item).some(
      (field) => !allowed.has(field),
    ),
  );
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
    project.screens.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.purpose === "string",
    ) &&
    project.elements.every(isElement) &&
    project.features.every((item) => item && typeof item.id === "string")
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
