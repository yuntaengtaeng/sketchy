import {
  createEmptyProject,
  type Project,
  type ProjectSettings,
} from "../../shared/index.ts";
import { readingOrder } from "../reading-order.ts";
import { adoptCanvasName } from "../canvas-name.ts";
import type { ProjectMetadata } from "../../core/project-change.ts";
import {
  migrateStoredProject,
  parseStoredProject,
} from "./project-migration.ts";

const KEY = "sketchy:project";
const METADATA_KEY = "sketchy:project-metadata";
const SYNC_STATE_KEY = "sketchy:sync-state";

// connected는 이 Figma 문서가 원격 Project에 연결됐는지
// lastSyncedRevision은 로컬과 서버가 마지막으로 일치했던 revision, decideSync의 기준점
export type SyncState = { connected: boolean; lastSyncedRevision: number };

export function readSyncState(): SyncState {
  try {
    const stored = JSON.parse(figma.root.getPluginData(SYNC_STATE_KEY));
    if (
      typeof stored.connected === "boolean" &&
      Number.isInteger(stored.lastSyncedRevision)
    )
      return stored;
  } catch {
    // Fall back to the disconnected default below.
  }
  return { connected: false, lastSyncedRevision: 0 };
}

export function writeSyncState(state: SyncState) {
  figma.root.setPluginData(SYNC_STATE_KEY, JSON.stringify(state));
}

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
    return migrateStoredProject(parseStoredProject(readStoredProjectData()));
  } catch {
    return createEmptyProject();
  }
}

function readStoredProjectData(): string {
  return figma.root.getPluginData(KEY);
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
  let nameChanged = false;
  for (const screen of screens) {
    const node = await figma.getNodeByIdAsync(screen.nodeId);
    if (adoptCanvasName(screen, node?.name)) nameChanged = true;
  }
  for (const element of elements) {
    const node = await figma.getNodeByIdAsync(element.nodeId);
    const label =
      node?.type === "TEXT"
        ? node.characters
        : node?.type === "FRAME" &&
            element.type !== "section" &&
            element.type !== "divider"
          ? node.children.find((child) => child.type === "TEXT")?.characters
          : undefined;
    if (adoptCanvasName(element, label) || adoptCanvasName(element, node?.name))
      nameChanged = true;
    if (node?.type === "FRAME")
      node.children
        .find(
          (child) => child.getPluginData("sketchy:role") === "state-indicator",
        )
        ?.remove();
  }
  const orderChanged = await normalizeElementOrder({
    ...project,
    screens,
    elements,
  });
  const features = project.features.filter((feature) => {
    const destinationScreenId =
      "destinationScreenId" in feature.action
        ? feature.action.destinationScreenId
        : undefined;
    return (
      screens.some((screen) => screen.id === feature.screenId) &&
      !!feature.trigger?.elementId &&
      elements.some((element) => element.id === feature.trigger?.elementId) &&
      (!destinationScreenId ||
        screens.some((screen) => screen.id === destinationScreenId))
    );
  });
  for (const feature of features) {
    const element = elements.find(
      (item) => item.id === feature.trigger?.elementId,
    );
    if (element && feature.name !== element.name) {
      feature.name = element.name;
      nameChanged = true;
    }
  }
  if (
    screens.length !== project.screens.length ||
    elements.length !== project.elements.length ||
    nameChanged ||
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

export async function normalizeElementOrder(project: Project) {
  let changed = false;
  for (const screen of project.screens) {
    const positioned = await Promise.all(
      project.elements
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
      if (item.order !== order) changed = true;
      item.order = order;
    });
  }
  return changed;
}
