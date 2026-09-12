import type {
  ProjectDocument,
  ProjectMetadata,
} from "../../core/project-change";
import type { Project } from "../../shared";
import { readProject, saveProjectSnapshot } from "../storage/project";
import {
  renderButtonVariant,
  renderElementName,
  renderSectionDirection,
} from "./canvas/element-render";
import { loadFont } from "./canvas/utils";

export async function applyProjectImport(document: ProjectDocument) {
  const current = readProject();
  const screenTargets = await Promise.all(
    document.project.screens.map(async (screen) => {
      const stored = current.screens.find((item) => item.id === screen.id);
      const node = stored && (await figma.getNodeByIdAsync(stored.nodeId));
      if (!stored || node?.type !== "FRAME")
        throw new Error(`Screen ${screen.id} is no longer available.`);
      return { screen, stored, node };
    }),
  );
  const elementTargets = await Promise.all(
    document.project.elements.map(async (element) => {
      const stored = current.elements.find((item) => item.id === element.id);
      const node = stored && (await figma.getNodeByIdAsync(stored.nodeId));
      const expectedType = element.type === "text" ? "TEXT" : "FRAME";
      if (!stored || node?.type !== expectedType)
        throw new Error(`Element ${element.id} is no longer available.`);
      return { element, stored, node: node as FrameNode | TextNode };
    }),
  );

  for (const { screen, stored, node } of screenTargets) {
    node.name = screen.name;
    for (const child of [...node.children])
      if (child.getPluginData("sketchy:role").startsWith("screen-"))
        child.remove();
    Object.assign(stored, screen);
  }

  await loadFont();
  const nodes = new Map(
    elementTargets.map((item) => [item.element.id, item.node]),
  );
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
  for (const feature of current.features) {
    const element = current.elements.find(
      (item) => item.id === feature.trigger?.elementId,
    );
    if (element) feature.name = element.name;
  }

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
