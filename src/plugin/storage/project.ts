import type { Feature, Project, ScreenState } from "../../shared";
import { readingOrder } from "../reading-order";

const KEY = "sketchy:project";
export function readProject(): Project {
  try {
    const stored = JSON.parse(figma.root.getPluginData(KEY)) || {};
    const features: Feature[] = stored.features
      ? stored.features.map(
          (feature: Feature & { sourceElementId?: string }) => ({
            ...feature,
            action:
              feature.action.type === ("toggle-state" as string)
                ? { ...feature.action, type: "set-state" as const, value: true }
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
      screens: stored.screens || [],
      elements: stored.elements || [],
      states: (stored.states || []).map((state: ScreenState) => ({
        ...state,
        type: state.type || ("boolean" as const),
        initialValue: state.initialValue ?? false,
      })),
      features,
    };
  } catch {
    return { screens: [], elements: [], states: [], features: [] };
  }
}
export const saveProject = (project: Project) =>
  figma.root.setPluginData(KEY, JSON.stringify(project));
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
  const states = project.states.filter((state) =>
    screens.some((screen) => screen.id === state.screenId),
  );
  const features = project.features
    .filter((feature) =>
      screens.some((screen) => screen.id === feature.screenId),
    )
    .map((feature) =>
      feature.trigger?.elementId &&
      !elements.some((element) => element.id === feature.trigger?.elementId)
        ? { ...feature, trigger: undefined }
        : feature,
    );
  if (
    screens.length !== project.screens.length ||
    elements.length !== project.elements.length ||
    orderChanged ||
    states.length !== project.states.length ||
    features.length !== project.features.length ||
    features.some((feature, index) => feature !== project.features[index])
  ) {
    project = { screens, elements, states, features };
    saveProject(project);
  }
  return project;
}
