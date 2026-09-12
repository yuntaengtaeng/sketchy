import {
  canNestSection,
  elementAncestors,
  elementTreeIds,
} from "../shared/element-tree.ts";
import type { Feature, FeatureAction } from "../shared/index.ts";
import type {
  CanonicalProject,
  ChangeIssue,
  ChangePreview,
  FeatureCaseInput,
  ProjectChangeRequest,
  ProjectDocument,
} from "./project-change";

export function previewProjectChanges(
  document: ProjectDocument,
  request: ProjectChangeRequest,
): ChangePreview {
  const errors: ChangeIssue[] = [];
  const warnings: ChangeIssue[] = [];
  const affected = new Set<string>();
  const project = JSON.parse(
    JSON.stringify(document.project),
  ) as CanonicalProject;

  if (request.projectId !== document.id)
    errors.push({
      code: "PROJECT_NOT_FOUND",
      message: "Project does not match.",
    });
  if (request.baseRevision !== document.revision)
    errors.push({
      code: "REVISION_CONFLICT",
      message: `Expected revision ${document.revision}.`,
    });
  if (!request.idempotencyKey.trim())
    errors.push({
      code: "IDEMPOTENCY_KEY_REQUIRED",
      message: "idempotencyKey is required.",
    });
  if (!request.changes.length)
    errors.push({
      code: "EMPTY_BATCH",
      message: "At least one change is required.",
    });

  request.changes.forEach((change, changeIndex) => {
    const fail = (code: string, message: string) =>
      errors.push({ code, changeIndex, message });
    const screen = (id: string) =>
      project.screens.find((item) => item.id === id);
    const element = (id: string) =>
      project.elements.find((item) => item.id === id);
    const feature = (id: string) =>
      project.features.find((item) => item.id === id);

    if (change.type === "CREATE_SCREEN") {
      if (screen(change.screen.id))
        return fail(
          "DUPLICATE_ID",
          `Screen ${change.screen.id} already exists.`,
        );
      if (change.screen.baseScreenId && !screen(change.screen.baseScreenId))
        return fail("SCREEN_NOT_FOUND", "Base screen does not exist.");
      project.screens.push(change.screen);
      affected.add(change.screen.id);
      return;
    }
    if (change.type === "UPDATE_SCREEN") {
      const target = screen(change.screenId);
      if (!target) return fail("SCREEN_NOT_FOUND", "Screen does not exist.");
      Object.assign(target, change.patch);
      affected.add(target.id);
      return;
    }
    if (change.type === "DELETE_SCREEN") {
      if (!screen(change.screenId))
        return fail("SCREEN_NOT_FOUND", "Screen does not exist.");
      const removedScreens = new Set(
        project.screens
          .filter(
            (item) =>
              item.id === change.screenId ||
              item.baseScreenId === change.screenId,
          )
          .map((item) => item.id),
      );
      const incoming = project.features.filter(
        (item) =>
          "destinationScreenId" in item.action &&
          !!item.action.destinationScreenId &&
          removedScreens.has(item.action.destinationScreenId),
      ).length;
      if (incoming)
        warnings.push({
          code: "INCOMING_CONNECTIONS_REMOVED",
          changeIndex,
          message: `${incoming} incoming connection(s) will be removed.`,
        });
      project.screens = project.screens.filter(
        (item) => !removedScreens.has(item.id),
      );
      const removedElements = new Set(
        project.elements
          .filter((item) => removedScreens.has(item.screenId))
          .map((item) => item.id),
      );
      project.elements = project.elements.filter(
        (item) => !removedElements.has(item.id),
      );
      project.features = project.features.filter(
        (item) =>
          !removedScreens.has(item.screenId) &&
          !(
            "destinationScreenId" in item.action &&
            !!item.action.destinationScreenId &&
            removedScreens.has(item.action.destinationScreenId)
          ),
      );
      removedScreens.forEach((id) => affected.add(id));
      return;
    }
    if (change.type === "ADD_ELEMENT") {
      const input = change.element;
      if (element(input.id))
        return fail("DUPLICATE_ID", `Element ${input.id} already exists.`);
      if (!screen(input.screenId))
        return fail("SCREEN_NOT_FOUND", "Element screen does not exist.");
      const parent = input.parentElementId
        ? element(input.parentElementId)
        : undefined;
      if (input.parentElementId && !parent)
        return fail("PARENT_NOT_FOUND", "Parent element does not exist.");
      if (parent && parent.type !== "section")
        return fail(
          "INVALID_PARENT",
          "Elements can only be nested in a section.",
        );
      if (parent && parent.screenId !== input.screenId)
        return fail("INVALID_PARENT", "Parent must belong to the same screen.");
      if (input.buttonVariant && input.type !== "button")
        return fail("INVALID_ELEMENT", "Only buttons have a button variant.");
      if (input.direction && input.type !== "section")
        return fail("INVALID_ELEMENT", "Only sections have a direction.");
      if (
        input.type === "section" &&
        parent &&
        !canNestSection(project.elements, parent)
      )
        return fail("SECTION_DEPTH_EXCEEDED", "Section nesting is too deep.");
      project.elements.push(input);
      affected.add(input.id);
      return;
    }
    if (change.type === "UPDATE_ELEMENT") {
      const target = element(change.elementId);
      if (!target) return fail("ELEMENT_NOT_FOUND", "Element does not exist.");
      if (change.patch.buttonVariant && target.type !== "button")
        return fail(
          "INVALID_ELEMENT_PATCH",
          "Only buttons have a button variant.",
        );
      if (change.patch.direction && target.type !== "section")
        return fail("INVALID_ELEMENT_PATCH", "Only sections have a direction.");
      Object.assign(target, change.patch);
      if (change.patch.name)
        project.features
          .filter((item) => item.trigger?.elementId === target.id)
          .forEach((item) => (item.name = change.patch.name!));
      affected.add(target.id);
      return;
    }
    if (change.type === "DELETE_ELEMENT") {
      const target = element(change.elementId);
      if (!target) return fail("ELEMENT_NOT_FOUND", "Element does not exist.");
      if (target.role === "popup")
        return fail("ELEMENT_REQUIRED", "The popup itself is required.");
      const removed = elementTreeIds(project.elements, change.elementId);
      project.elements = project.elements.filter(
        (item) => !removed.has(item.id),
      );
      project.features = project.features.filter(
        (item) =>
          !item.trigger?.elementId || !removed.has(item.trigger.elementId),
      );
      removed.forEach((id) => affected.add(id));
      return;
    }
    if (change.type === "SET_ELEMENT_ACTION") {
      const target = element(change.elementId);
      if (!target) return fail("ELEMENT_NOT_FOUND", "Element does not exist.");
      const current = project.features.find(
        (item) => item.trigger?.elementId === target.id && !item.condition,
      );
      const existing = feature(change.featureId);
      if (existing && existing !== current)
        return fail(
          "DUPLICATE_ID",
          `Feature ${change.featureId} already exists.`,
        );
      if (!validAction(project, target, change.action, fail)) return;
      const next = createFeature(current?.id || change.featureId, target, {
        id: current?.id || change.featureId,
        action: change.action,
        description: change.description,
      });
      if (current) project.features[project.features.indexOf(current)] = next;
      else project.features.push(next);
      affected.add(target.id);
      return;
    }
    if (change.type === "CLEAR_ELEMENT_ACTION") {
      const target = element(change.elementId);
      if (!target) return fail("ELEMENT_NOT_FOUND", "Element does not exist.");
      if (target.type !== "button")
        return fail(
          "TRIGGER_NOT_SUPPORTED",
          "Only buttons support actions in v1.",
        );
      const primary = project.features.filter(
        (item) =>
          item.trigger?.type === "click" &&
          item.trigger.elementId === target.id &&
          !item.condition?.trim(),
      );
      if (!primary.length)
        return fail("ACTION_NOT_FOUND", "Element has no default action.");
      if (primary.length > 1)
        return fail("ACTION_CONFLICT", "Element has multiple default actions.");
      project.features = project.features.filter((item) => item !== primary[0]);
      affected.add(target.id);
      return;
    }
    if (change.type === "ADD_ELEMENT_CASE") {
      const target = element(change.elementId);
      if (!target) return fail("ELEMENT_NOT_FOUND", "Element does not exist.");
      if (feature(change.case.id))
        return fail(
          "DUPLICATE_ID",
          `Feature ${change.case.id} already exists.`,
        );
      if (!change.case.condition?.trim())
        return fail(
          "CONDITION_REQUIRED",
          "An additional case needs a condition.",
        );
      if (!validAction(project, target, change.case.action, fail)) return;
      project.features.push(createFeature(change.case.id, target, change.case));
      affected.add(target.id);
      return;
    }
    if (change.type === "UPDATE_ELEMENT_CASE") {
      const target = feature(change.featureId);
      if (!target) return fail("FEATURE_NOT_FOUND", "Feature does not exist.");
      const source = target.trigger?.elementId
        ? element(target.trigger.elementId)
        : undefined;
      if (!source)
        return fail("ELEMENT_NOT_FOUND", "Feature element does not exist.");
      if (
        change.patch.action &&
        !validAction(project, source, change.patch.action, fail)
      )
        return;
      Object.assign(target, change.patch);
      affected.add(target.id);
      return;
    }
    if (change.type === "REMOVE_ELEMENT_CASE") {
      if (!feature(change.featureId))
        return fail("FEATURE_NOT_FOUND", "Feature does not exist.");
      project.features = project.features.filter(
        (item) => item.id !== change.featureId,
      );
      affected.add(change.featureId);
      return;
    }
    if (change.projection.revision !== document.revision)
      return fail(
        "PROJECTION_REVISION_MISMATCH",
        "Projection must target the current revision.",
      );
  });

  return {
    valid: errors.length === 0,
    baseRevision: request.baseRevision,
    errors,
    warnings,
    affectedEntityIds: [...affected],
    nextProject: errors.length ? undefined : project,
  };
}

function createFeature(
  id: string,
  element: CanonicalProject["elements"][number],
  input: FeatureCaseInput,
): Feature {
  return {
    id,
    screenId: element.screenId,
    name: element.name,
    trigger: { type: "click", elementId: element.id },
    action: input.action,
    condition: input.condition?.trim() || undefined,
    description: input.description?.trim() || undefined,
  };
}

function validAction(
  project: CanonicalProject,
  element: CanonicalProject["elements"][number],
  action: FeatureAction,
  fail: (code: string, message: string) => void,
) {
  if (element.type !== "button") {
    fail("TRIGGER_NOT_SUPPORTED", "Only buttons support actions in v1.");
    return false;
  }
  const sourceScreen = project.screens.find(
    (item) => item.id === element.screenId,
  );
  if (
    (action.type === "navigate" || action.type === "overlay") &&
    !action.destinationScreenId
  ) {
    fail("DESTINATION_REQUIRED", `${action.type} needs a destination.`);
    return false;
  }
  const destination =
    "destinationScreenId" in action && action.destinationScreenId
      ? project.screens.find((item) => item.id === action.destinationScreenId)
      : undefined;
  if (
    "destinationScreenId" in action &&
    action.destinationScreenId &&
    !destination
  ) {
    fail("DESTINATION_NOT_FOUND", "Destination screen does not exist.");
    return false;
  }
  if (action.type === "navigate" && destination?.kind) {
    fail("INVALID_DESTINATION", "Navigate needs a regular screen.");
    return false;
  }
  if (action.type === "overlay" && sourceScreen?.kind) {
    fail("NESTED_OVERLAY", "A popup cannot open another popup.");
    return false;
  }
  if (
    action.type === "overlay" &&
    destination &&
    (destination.kind !== "popup" ||
      destination.baseScreenId !== element.screenId)
  ) {
    fail("INVALID_DESTINATION", "Overlay needs a popup from the same screen.");
    return false;
  }
  const insidePopup = elementAncestors(project.elements, element).some(
    (item) => item.role === "popup",
  );
  if (action.type === "close-overlay" && !insidePopup) {
    fail("NOT_INSIDE_POPUP", "Only an element inside a popup can close it.");
    return false;
  }
  return true;
}
