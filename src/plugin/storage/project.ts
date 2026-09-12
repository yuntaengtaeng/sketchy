import {
  createEmptyProject,
  SCREEN_PRESETS,
  type Feature,
  type Project,
  type ProjectSettings,
} from "../../shared";
import { readingOrder } from "../reading-order";
import type { ProjectMetadata } from "../../core/project-change";

const KEY = "sketchy:project";
const METADATA_KEY = "sketchy:project-metadata";

export function readProjectMetadata(): ProjectMetadata {
  try {
    const stored = JSON.parse(figma.root.getPluginData(METADATA_KEY));
    if (
      typeof stored.id === "string" &&
      Number.isInteger(stored.revision) &&
      typeof stored.updatedAt === "string"
    )
      return stored;
  } catch {
    // Initialize metadata below.
  }
  const metadata = {
    id: `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    revision: 0,
    updatedAt: new Date().toISOString(),
  };
  figma.root.setPluginData(METADATA_KEY, JSON.stringify(metadata));
  return metadata;
}

export function readProject(): Project {
  try {
    const stored = JSON.parse(figma.root.getPluginData(KEY)) || {};
    const screenPreset = stored.settings?.screenPreset;
    const features: Feature[] = stored.features
      ? stored.features.map(
          (feature: Feature & { sourceElementId?: string }) => ({
            ...feature,
            action: ["toggle-state", "set-state"].includes(
              feature.action.type as string,
            )
              ? { type: "describe" as const }
              : feature.action,
            trigger:
              feature.trigger ||
              (feature.sourceElementId
                ? { type: "click" as const, elementId: feature.sourceElementId }
                : undefined),
            sourceElementId: undefined,
          }),
        )
      : (stored.interactions || []).map(
          (item: {
            id: string;
            sourceElementId: string;
            destinationScreenId: string;
          }) => ({
            id: item.id,
            screenId:
              stored.elements?.find(
                (element: { id: string }) =>
                  element.id === item.sourceElementId,
              )?.screenId || "",
            name:
              stored.elements?.find(
                (element: { id: string }) =>
                  element.id === item.sourceElementId,
              )?.name || "Feature",
            trigger: {
              type: "click" as const,
              elementId: item.sourceElementId,
            },
            action: {
              type: "navigate" as const,
              destinationScreenId: item.destinationScreenId,
            },
          }),
        );
    return {
      settings: {
        screenPreset:
          typeof screenPreset === "string" && screenPreset in SCREEN_PRESETS
            ? (screenPreset as keyof typeof SCREEN_PRESETS)
            : "mobile",
      },
      screens: stored.screens || [],
      elements: stored.elements || [],
      features,
    };
  } catch {
    return createEmptyProject();
  }
}
export const saveProject = (project: Project) => {
  figma.root.setPluginData(KEY, JSON.stringify(project));
  const metadata = readProjectMetadata();
  figma.root.setPluginData(
    METADATA_KEY,
    JSON.stringify({
      ...metadata,
      revision: metadata.revision + 1,
      updatedAt: new Date().toISOString(),
    }),
  );
};
export function saveProjectSnapshot(
  project: Project,
  metadata: ProjectMetadata,
) {
  figma.root.setPluginData(KEY, JSON.stringify(project));
  figma.root.setPluginData(METADATA_KEY, JSON.stringify(metadata));
}
export function updateProjectSettings(settings: ProjectSettings) {
  const project = readProject();
  project.settings = settings;
  saveProject(project);
  return project;
}
export async function cleanProject(project: Project) {
  const exists = async <T extends { nodeId: string }>(item: T) =>
    (await figma.getNodeByIdAsync(item.nodeId)) ? item : undefined;
  const present = <T>(item: T | undefined): item is T => item !== undefined;
  const screens = (await Promise.all(project.screens.map(exists))).filter(
    present,
  );
  const elements = (await Promise.all(project.elements.map(exists)))
    .filter(present)
    .filter((item) => screens.some((screen) => screen.id === item.screenId));
  for (const element of elements) {
    const node = await figma.getNodeByIdAsync(element.nodeId);
    if (node?.type === "FRAME")
      node.children
        .find(
          (child) => child.getPluginData("sketchy:role") === "state-indicator",
        )
        ?.remove();
  }
  let orderChanged = false;
  for (const screen of screens) {
    const positioned = await Promise.all(
      elements
        .filter((element) => element.screenId === screen.id)
        .map(async (element) => {
          const node = await figma.getNodeByIdAsync(element.nodeId);
          const box =
            node && "absoluteBoundingBox" in node
              ? node.absoluteBoundingBox
              : undefined;
          return {
            item: element,
            x: box?.x ?? Number.MAX_SAFE_INTEGER,
            y: box?.y ?? Number.MAX_SAFE_INTEGER,
          };
        }),
    );
    readingOrder(positioned).forEach(({ item }, order) => {
      if (item.order !== order) orderChanged = true;
      item.order = order;
    });
  }
  const features = project.features.filter(
    (feature) =>
      screens.some((screen) => screen.id === feature.screenId) &&
      !!feature.trigger?.elementId &&
      elements.some((element) => element.id === feature.trigger?.elementId),
  );
  if (
    screens.length !== project.screens.length ||
    elements.length !== project.elements.length ||
    orderChanged ||
    features.length !== project.features.length ||
    features.some((feature, index) => feature !== project.features[index])
  ) {
    project = {
      settings: project.settings,
      screens,
      elements,
      features,
    };
    saveProject(project);
  }
  return project;
}
