import type { ProjectDocument } from "../core/project-change.ts";

export function getProject(document: ProjectDocument) {
  return {
    id: document.id,
    revision: document.revision,
    updatedAt: document.updatedAt,
    settings: document.project.settings,
    screens: document.project.screens,
    figmaProjection: document.figmaProjection,
  };
}

export function getScreen(document: ProjectDocument, screenId: string) {
  const screen = document.project.screens.find((item) => item.id === screenId);
  if (!screen) throw new Error(`Screen ${screenId} does not exist.`);

  const elements = document.project.elements.filter(
    (item) => item.screenId === screenId,
  );
  const elementIds = new Set(elements.map((item) => item.id));
  const nodes = document.figmaProjection?.nodes;

  return {
    screen,
    elements,
    features: document.project.features.filter(
      (item) =>
        item.screenId === screenId ||
        (!!item.trigger?.elementId && elementIds.has(item.trigger.elementId)),
    ),
    figmaNodes: nodes
      ? Object.fromEntries(
          [screen.id, ...elementIds]
            .filter((id) => nodes[id])
            .map((id) => [id, nodes[id]]),
        )
      : undefined,
  };
}
