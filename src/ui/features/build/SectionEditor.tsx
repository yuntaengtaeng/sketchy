import type { Element as SketchyElement, Project } from "../../../shared";
import { canNestSection } from "../../../shared";
import BlockPicker from "./BlockPicker";
import NodeList from "./NodeList";

export default function SectionEditor({
  project,
  screenId,
  section,
  selectedElementId,
}: {
  project: Project;
  screenId: string;
  section: SketchyElement;
  selectedElementId?: string;
}) {
  const nodes = project.elements
    .filter((item) => item.parentElementId === section.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return (
    <>
      <BlockPicker
        screenId={screenId}
        sectionId={section.id}
        allowSection={canNestSection(project.elements, section)}
      />
      <NodeList
        title={`Inside ${section.name}`}
        nodes={nodes}
        selectedElementId={selectedElementId}
      />
    </>
  );
}
