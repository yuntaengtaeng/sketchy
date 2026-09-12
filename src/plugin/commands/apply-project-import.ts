import type {
  DomainElement,
  DomainScreen,
  ProjectDocument,
  ProjectMetadata,
} from "../../core/project-change";
import { elementAncestors, type Project } from "../../shared";
import { readProject, saveProjectSnapshot } from "../storage/project";
import {
  createElementNode,
  renderButtonVariant,
  renderElementName,
  renderSectionDirection,
} from "./canvas/element-render";
import { loadFont } from "./canvas/utils";
import { createScreenNode } from "./canvas/screen";
import { syncReaction } from "./canvas/feature";

export async function applyProjectImport(document: ProjectDocument) {
  const current = readProject();
  const previousFeatures = current.features;
  const importedScreenIds = new Set(
    document.project.screens.map((screen) => screen.id),
  );
  const removedScreens = current.screens.filter(
    (screen) => !importedScreenIds.has(screen.id),
  );
  const removedScreenIds = new Set(removedScreens.map((screen) => screen.id));
  const removedScreenTargets = await Promise.all(
    removedScreens.map(async (screen) => {
      const node = await figma.getNodeByIdAsync(screen.nodeId);
      if (node?.type !== "FRAME")
        throw new Error(`Screen ${screen.id} is no longer available.`);
      return node;
    }),
  );
  const importedElementIds = new Set(
    document.project.elements.map((element) => element.id),
  );
  const removedElements = current.elements.filter(
    (element) =>
      !importedElementIds.has(element.id) &&
      !removedScreenIds.has(element.screenId),
  );
  const removedElementIds = new Set(
    removedElements.map((element) => element.id),
  );
  const removedTargets = await Promise.all(
    removedElements
      .filter(
        (element) =>
          !element.parentElementId ||
          !removedElementIds.has(element.parentElementId),
      )
      .map(async (element) => {
        const node = await figma.getNodeByIdAsync(element.nodeId);
        if (!node)
          throw new Error(`Element ${element.id} is no longer available.`);
        return node;
      }),
  );
  const screenTargets = await Promise.all(
    current.screens
      .filter((stored) => importedScreenIds.has(stored.id))
      .map(async (stored) => {
        const screen = document.project.screens.find(
          (item) => item.id === stored.id,
        )!;
        const node = await figma.getNodeByIdAsync(stored.nodeId);
        if (node?.type !== "FRAME")
          throw new Error(`Screen ${screen.id} is no longer available.`);
        return { screen, stored, node };
      }),
  );
  const elementTargets = await Promise.all(
    current.elements
      .filter((stored) => importedElementIds.has(stored.id))
      .map(async (stored) => {
        const element = document.project.elements.find(
          (item) => item.id === stored.id,
        )!;
        const node = await figma.getNodeByIdAsync(stored.nodeId);
        const expectedType = element.type === "text" ? "TEXT" : "FRAME";
        if (node?.type !== expectedType)
          throw new Error(`Element ${element.id} is no longer available.`);
        return { element, stored, node: node as FrameNode | TextNode };
      }),
  );

  await loadFont();
  const nodes = new Map<string, BaseNode>(
    elementTargets.map((item) => [item.element.id, item.node]),
  );
  const screenNodes = new Map(
    screenTargets.map((item) => [item.screen.id, item.node]),
  );
  const addedScreens = document.project.screens.filter(
    (screen) => !screenNodes.has(screen.id),
  );
  const added = document.project.elements
    .filter((element) => !nodes.has(element.id))
    .sort(
      (left, right) =>
        elementAncestors(document.project.elements, left).length -
        elementAncestors(document.project.elements, right).length,
    );
  const created: SceneNode[] = [];
  try {
    const positionedScreens = screenTargets
      .map((item) => item.node)
      .filter((node) => node.parent === figma.currentPage);
    for (const screen of addedScreens) {
      const node = createScreenNode(
        screen,
        current.settings.screenPreset,
        positionedScreens,
      );
      created.push(node);
      positionedScreens.push(node);
      screenNodes.set(screen.id, node);
      current.screens.push(withScreenNodeId(screen, node.id));
    }
    for (const element of added) {
      const parent = element.parentElementId
        ? nodes.get(element.parentElementId)
        : screenNodes.get(element.screenId);
      if (parent?.type !== "FRAME")
        throw new Error(`Parent for ${element.id} is no longer available.`);
      const node = createElementNode(element, parent);
      created.push(node);
      nodes.set(element.id, node);
      current.elements.push(withNodeId(element, node.id));
    }
  } catch (error) {
    for (const node of created.reverse()) node.remove();
    throw error;
  }

  for (const { screen, stored, node } of screenTargets) {
    node.name = screen.name;
    for (const child of [...node.children])
      if (child.getPluginData("sketchy:role").startsWith("screen-"))
        child.remove();
    Object.assign(stored, screen);
  }

  for (const { element, stored, node } of elementTargets) {
    renderElementName(node, stored, element.name);
    if (element.type === "button" && node.type === "FRAME")
      renderButtonVariant(node, element.buttonVariant || "filled");
    if (element.type === "section" && node.type === "FRAME")
      renderSectionDirection(
        node,
        element.direction || "vertical",
        document.project.elements
          .filter((item) => item.parentElementId === element.id)
          .map((child) => ({
            element: current.elements.find((item) => item.id === child.id)!,
            node: nodes.get(child.id) || null,
          })),
      );
    Object.assign(stored, element);
  }
  const changedActionElementIds = document.project.features.flatMap(
    (feature) => {
      const previous = previousFeatures.find((item) => item.id === feature.id);
      return !previous ||
        JSON.stringify(previous.action) !== JSON.stringify(feature.action) ||
        previous.description !== feature.description
        ? [feature.trigger?.elementId]
        : [];
    },
  );
  for (const feature of previousFeatures)
    if (
      !document.project.features.some((item) => item.id === feature.id) &&
      feature.trigger?.elementId &&
      importedElementIds.has(feature.trigger.elementId)
    )
      changedActionElementIds.push(feature.trigger.elementId);
  current.features = document.project.features;
  for (const feature of current.features) {
    const element = current.elements.find(
      (item) => item.id === feature.trigger?.elementId,
    );
    if (element) feature.name = element.name;
  }
  for (const elementId of new Set(changedActionElementIds)) {
    const node = elementId ? nodes.get(elementId) : undefined;
    if (!elementId || !node || !("setReactionsAsync" in node))
      throw new Error(
        `Button ${elementId || "action"} is no longer available.`,
      );
    await syncReaction(
      node as SceneNode & ReactionMixin,
      current,
      previousFeatures.filter(
        (feature) => feature.trigger?.elementId === elementId,
      ),
      elementId,
    );
  }
  for (const node of removedTargets) node.remove();
  for (const node of removedScreenTargets) node.remove();
  current.screens = current.screens.filter((screen) =>
    importedScreenIds.has(screen.id),
  );
  current.elements = current.elements.filter((element) =>
    importedElementIds.has(element.id),
  );

  const project: Project = {
    settings: current.settings,
    screens: current.screens,
    elements: current.elements,
    features: current.features,
  };
  const metadata: ProjectMetadata = {
    id: document.id,
    revision: document.revision,
    updatedAt: document.updatedAt,
  };
  saveProjectSnapshot(project, metadata);
  return project;
}

function withNodeId(element: DomainElement, nodeId: string) {
  return { ...element, nodeId };
}

function withScreenNodeId(screen: DomainScreen, nodeId: string) {
  return { ...screen, nodeId };
}
