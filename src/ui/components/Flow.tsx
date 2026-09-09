import type { Project } from "../../shared";
import { post } from "../plugin";
import styles from "./Flow.module.css";

export default function Flow({ project }: { project: Project }) {
  return (
    <section>
      <h2>Project flow</h2>
      {!project.interactions.length && (
        <p className="muted">No connected buttons yet.</p>
      )}
      {project.interactions.map((link) => {
        const source = project.elements.find(
          (item) => item.id === link.sourceElementId,
        )!;
        const sourceScreen = project.screens.find(
          (item) => item.id === source.screenId,
        )!;
        const destination = project.screens.find(
          (item) => item.id === link.destinationScreenId,
        )!;
        return (
          <div className={styles.connection} key={link.id}>
            <button
              onClick={() =>
                post({ type: "SELECT_SCREEN", screenId: sourceScreen.id })
              }
            >
              {sourceScreen.name}
            </button>
            <span>
              <small>{source.name}</small>→
            </span>
            <button
              onClick={() =>
                post({ type: "SELECT_SCREEN", screenId: destination.id })
              }
            >
              {destination.name}
            </button>
          </div>
        );
      })}
    </section>
  );
}
