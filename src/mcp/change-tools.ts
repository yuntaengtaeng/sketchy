import { createHash } from "node:crypto";
import type {
  ProjectChange,
  ProjectChangeRequest,
  ProjectDocument,
} from "../core/project-change.ts";
import { previewProjectChanges } from "../core/validate-project-changes.ts";

export function previewChanges(
  document: ProjectDocument,
  request: ProjectChangeRequest,
) {
  const preview = previewProjectChanges(document, request);
  return {
    previewId: `preview-${createHash("sha256")
      .update(JSON.stringify(request))
      .digest("hex")
      .slice(0, 16)}`,
    valid: preview.valid,
    baseRevision: request.baseRevision,
    currentRevision: document.revision,
    summary: request.changes.map(changeSummary),
    errors: preview.errors,
    warnings: preview.warnings,
    affectedEntityIds: preview.affectedEntityIds,
  };
}

export function applyChanges(
  document: ProjectDocument,
  previewId: string,
  request: ProjectChangeRequest,
) {
  const applied = document.appliedBatches?.[request.idempotencyKey];
  if (applied) {
    if (applied.previewId !== previewId)
      return {
        result: failed(
          "IDEMPOTENCY_KEY_REUSED",
          "idempotencyKey was already used.",
        ),
      };
    return {
      result: {
        applied: true as const,
        idempotent: true,
        projectId: document.id,
        previousRevision: applied.revision - 1,
        revision: applied.revision,
        projectionStatus: document.figmaProjection?.status,
      },
    };
  }

  const preview = previewChanges(document, request);
  if (preview.previewId !== previewId)
    return {
      result: failed(
        "PREVIEW_MISMATCH",
        "previewId does not match this change request.",
      ),
    };
  if (!preview.valid)
    return {
      result: { applied: false as const, errors: preview.errors },
    };

  const project = previewProjectChanges(document, request).nextProject!;
  const revision = document.revision + 1;
  const entityIds = new Set([
    ...project.screens.map((item) => item.id),
    ...project.elements.map((item) => item.id),
  ]);
  const figmaProjection = document.figmaProjection
    ? {
        ...document.figmaProjection,
        status: "pending" as const,
        nodes: Object.fromEntries(
          Object.entries(document.figmaProjection.nodes).filter(([id]) =>
            entityIds.has(id),
          ),
        ),
      }
    : undefined;
  const nextDocument: ProjectDocument = {
    ...document,
    revision,
    updatedAt: new Date().toISOString(),
    project,
    figmaProjection,
    appliedBatches: {
      ...document.appliedBatches,
      [request.idempotencyKey]: { revision, previewId },
    },
  };
  return {
    result: {
      applied: true as const,
      idempotent: false,
      projectId: document.id,
      previousRevision: document.revision,
      revision,
      projectionStatus: figmaProjection?.status,
    },
    nextDocument,
  };
}

function failed(code: string, message: string) {
  return { applied: false as const, errors: [{ code, message }] };
}

function changeSummary(change: ProjectChange) {
  switch (change.type) {
    case "CREATE_SCREEN":
      return `Create screen ${change.screen.name}`;
    case "UPDATE_SCREEN":
      return `Update screen ${change.screenId}`;
    case "DELETE_SCREEN":
      return `Delete screen ${change.screenId}`;
    case "ADD_ELEMENT":
      return `Add ${change.element.type} ${change.element.name}`;
    case "UPDATE_ELEMENT":
      return `Update element ${change.elementId}`;
    case "DELETE_ELEMENT":
      return `Delete element ${change.elementId}`;
    case "SET_ELEMENT_ACTION":
      return `Set ${change.action.type} action on ${change.elementId}`;
    case "CLEAR_ELEMENT_ACTION":
      return `Clear default action on ${change.elementId}`;
    case "ADD_ELEMENT_CASE":
      return `Add case to ${change.elementId}`;
    case "UPDATE_ELEMENT_CASE":
      return `Update case ${change.featureId}`;
    case "REMOVE_ELEMENT_CASE":
      return `Remove case ${change.featureId}`;
    case "RECORD_FIGMA_PROJECTION":
      return `Record Figma projection ${change.projection.status}`;
  }
}
