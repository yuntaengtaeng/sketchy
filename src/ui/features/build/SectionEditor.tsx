import type { Element as SketchyElement, Project } from "../../../shared";
import { post } from "../../plugin";
import BlockPicker from "./BlockPicker";
import styles from "./Build.module.css";

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
      <section>
        <h2>{section.name}</h2>
        <p className="muted">New elements are added inside this section.</p>
      </section>
      <BlockPicker screenId={screenId} sectionId={section.id} />
      <section>
        <h2>Nodes</h2>
        <div className={styles.nodes}>
          {nodes.map((item) => (
            <button
              key={item.id}
              aria-pressed={selectedElementId === item.id}
              onClick={() =>
                post({ type: "SELECT_ELEMENT", elementId: item.id })
              }
            >
              <span>{item.name}</span>
              <small>{item.type}</small>
            </button>
          ))}
          {!nodes.length && <p className="muted">No elements yet.</p>}
        </div>
      </section>
    </>
  );
}
