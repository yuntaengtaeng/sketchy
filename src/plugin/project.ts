import type { Project } from "../shared";

const KEY = "sketchy:project";
export function readProject(): Project {
  try {
    return (
      JSON.parse(figma.root.getPluginData(KEY)) || {
        screens: [],
        elements: [],
        interactions: [],
      }
    );
  } catch {
    return { screens: [], elements: [], interactions: [] };
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
  const interactions = project.interactions.filter(
    (link) =>
      elements.some((item) => item.id === link.sourceElementId) &&
      screens.some((item) => item.id === link.destinationScreenId),
  );
  if (
    screens.length !== project.screens.length ||
    elements.length !== project.elements.length ||
    interactions.length !== project.interactions.length
  ) {
    project = { screens, elements, interactions };
    saveProject(project);
  }
  return project;
}
