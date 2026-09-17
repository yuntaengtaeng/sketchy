import type { Element as SketchyElement } from "../../../shared";
import { post } from "../../plugin";
import styles from "./NodeList.module.css";

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
        {nodes.map((item, index) => (
          <div className={styles.node} key={item.id}>
            <button
              className={styles.nodeSelect}
              aria-pressed={selectedElementId === item.id}
              onClick={() =>
                post({ type: "SELECT_ELEMENT", elementId: item.id })
              }
            >
              <span>{item.name}</span>
              <small>{item.type}</small>
            </button>
            <div className={styles.nodeMove}>
              <button
                aria-label={`Move ${item.name} up`}
                disabled={index === 0}
                onClick={() =>
                  post({
                    type: "MOVE_ELEMENT",
                    elementId: item.id,
                    direction: "up",
                  })
                }
              >
                ▲
              </button>
              <button
                aria-label={`Move ${item.name} down`}
                disabled={index === nodes.length - 1}
                onClick={() =>
                  post({
                    type: "MOVE_ELEMENT",
                    elementId: item.id,
                    direction: "down",
                  })
                }
              >
                ▼
              </button>
            </div>
          </div>
        ))}
        {!nodes.length && <p className="muted">No elements yet.</p>}
      </div>
    </section>
  );
}
