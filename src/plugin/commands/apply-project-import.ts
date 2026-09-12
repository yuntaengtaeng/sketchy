import type {
  ProjectDocument,
  ProjectMetadata,
} from "../../core/project-change";
import type { Project } from "../../shared";
import { readProject, saveProjectSnapshot } from "../storage/project";

export async function applyScreenImport(document: ProjectDocument) {
  const current = readProject();
  const targets = await Promise.all(
    document.project.screens.map(async (screen) => {
      const stored = current.screens.find((item) => item.id === screen.id);
      const node = stored && (await figma.getNodeByIdAsync(stored.nodeId));
      if (!stored || node?.type !== "FRAME")
        throw new Error(`Screen ${screen.id} is no longer available.`);
      return { screen, stored, node };
    }),
  );

  for (const { screen, stored, node } of targets) {
    node.name = screen.name;
    for (const child of [...node.children])
      if (child.getPluginData("sketchy:role").startsWith("screen-"))
        child.remove();
    Object.assign(stored, screen);
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
