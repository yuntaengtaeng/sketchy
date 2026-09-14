import {
  createEmptyProject,
  type BlockType,
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
// Element가 화면에서 실제로 보여주는 글자, Text는 내용, Button/Input은
// 안에 넣은 Label Text, Section/Divider는 표시할 글자가 없어 undefined
function elementLabel(node: BaseNode | null, type: BlockType) {
  if (node?.type === "TEXT") return node.characters;
  if (node?.type !== "FRAME" || type === "section" || type === "divider")
    return undefined;
  return node.children.find((child) => child.type === "TEXT")?.characters;
}

export async function cleanProject(project: Project) {
  // Screen, Element 각각 존재 확인과 이름 동기화에 같은 nodeId를 두 번
  // 순차 조회하던 것을 한 번의 병렬 조회로 합친다
  let nameChanged = false;
  const screenLookups = await Promise.all(
    project.screens.map(async (screen) => ({
      screen,
      node: await figma.getNodeByIdAsync(screen.nodeId),
    })),
  );
  const screens = screenLookups
    .filter(({ node }) => node)
    .map(({ screen, node }) => {
      if (adoptCanvasName(screen, node?.name)) nameChanged = true;
      return screen;
    });

  const elementLookups = await Promise.all(
    project.elements.map(async (element) => ({
      element,
      node: await figma.getNodeByIdAsync(element.nodeId),
    })),
  );
  const elements = elementLookups
    .filter(
      ({ element, node }) =>
        node && screens.some((screen) => screen.id === element.screenId),
    )
    .map(({ element, node }) => {
      if (
        adoptCanvasName(element, elementLabel(node, element.type)) ||
        adoptCanvasName(element, node?.name)
      )
        nameChanged = true;
      if (node?.type === "FRAME")
        node.children
          .find(
            (child) =>
              child.getPluginData("sketchy:role") === "state-indicator",
          )
          ?.remove();
      return element;
    });
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
  // 화면별로 순차 조회하면 화면이 많을수록 느려지므로 전체 Element를 한 번에 병렬 조회
  const positions = new Map(
    await Promise.all(
      project.elements.map(async (element) => {
        const node = await figma.getNodeByIdAsync(element.nodeId);
        const box =
          node && "absoluteBoundingBox" in node
            ? node.absoluteBoundingBox
            : undefined;
        return [
          element.id,
          {
            x: box?.x ?? Number.MAX_SAFE_INTEGER,
            y: box?.y ?? Number.MAX_SAFE_INTEGER,
          },
        ] as const;
      }),
    ),
  );
  for (const screen of project.screens) {
    const positioned = project.elements
      .filter((element) => element.screenId === screen.id)
      .map((item) => ({ item, ...positions.get(item.id)! }));
    readingOrder(positioned).forEach(({ item }, order) => {
      if (item.order !== order) changed = true;
      item.order = order;
    });
  }
  return changed;
}
