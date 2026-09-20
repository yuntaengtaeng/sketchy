import {
  createEmptyProject,
  type Project,
  type ProjectSettings,
} from "../../shared/index.ts";
import { readingOrder } from "../reading-order.ts";
import { adoptCanvasName, elementLabelText } from "../canvas-name.ts";
import { syncScreenEdgePadding } from "../commands/canvas/headerFooterLayout.ts";
import {
  migrateStoredProject,
  parseStoredProject,
} from "./project-migration.ts";

const KEY = "sketchy:project";

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
};
export function updateProjectSettings(settings: ProjectSettings) {
  const project = readProject();
  project.settings = settings;
  saveProject(project);
  return project;
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
      // 이름을 보여주는 자리가 있으면 그 텍스트만 본다, 레이어 이름과 함께
      // 순차 시도하면 둘이 다를 때마다 서로 되돌리는 진동이 생긴다
      const canvasName = elementLabelText(node, element.type) ?? node?.name;
      if (adoptCanvasName(element, canvasName)) nameChanged = true;
      if (node?.type === "FRAME")
        node.children
          .find(
            (child) =>
              child.getPluginData("sketchy:role") === "state-indicator",
          )
          ?.remove();
      return element;
    });
  // Figma 단축키로 지운 Header/Footer도 반영되는 화면 패딩 재동기화
  for (const { node } of screenLookups)
    if (node?.type === "FRAME") syncScreenEdgePadding(node, elements);
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
