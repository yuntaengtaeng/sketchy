import type { Element as SketchyElement } from "../../../shared";
import { post } from "../../plugin";
import styles from "./Build.module.css";

export default function NodeList({
  title,
  nodes,
  selectedElementId,
}: {
  title: string;
  nodes: SketchyElement[];
  selectedElementId?: string;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <div className={styles.nodes}>
        {nodes.map((item) => (
          <button
            key={item.id}
            aria-pressed={selectedElementId === item.id}
            onClick={() => post({ type: "SELECT_ELEMENT", elementId: item.id })}
          >
            <span>{item.name}</span>
            <small>{item.type}</small>
          </button>
        ))}
        {!nodes.length && <p className="muted">No elements yet.</p>}
      </div>
    </section>
  );
}
