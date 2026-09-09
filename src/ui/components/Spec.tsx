import { useMemo } from "react";
import type { Project, Screen } from "../../shared";
import styles from "./Spec.module.css";

export default function Spec({
  project,
  screen,
}: {
  project: Project;
  screen?: Screen;
}) {
  const outgoing = useMemo(
    () =>
      project.interactions.filter((link) => {
        const source = project.elements.find(
          (item) => item.id === link.sourceElementId,
        );
        return source?.screenId === screen?.id;
      }),
    [project, screen],
  );

  return (
    <section className={styles.spec}>
      <h1>{screen?.name || "Select a screen"}</h1>
      {screen && (
        <>
          <h2>Purpose</h2>
          <p>{screen.purpose || "Not described yet."}</p>
          <h2>Interactions</h2>
          {!outgoing.length && <p className="muted">No interactions yet.</p>}
          {outgoing.map((link) => {
            const source = project.elements.find(
              (item) => item.id === link.sourceElementId,
            )!;
            const destination = project.screens.find(
              (item) => item.id === link.destinationScreenId,
            )!;
            return (
              <div key={link.id}>
                <h3>{source.name}</h3>
                <p>Click · Navigate to {destination.name}</p>
                {source.description && <p>{source.description}</p>}
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}
