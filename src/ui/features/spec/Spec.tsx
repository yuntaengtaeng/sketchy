import type { Project, Screen } from "../../../shared";
import { describeFeature, title } from "./describe";
import styles from "./Spec.module.css";

export default function Spec({
  project,
  screen,
}: {
  project: Project;
  screen?: Screen;
}) {
  const elements = project.elements
    .filter((element) => element.screenId === screen?.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const features = project.features.filter(
    (feature) => feature.screenId === screen?.id,
  );
  return (
    <section className={styles.spec}>
      <h1>{screen?.name || "Select a screen"}</h1>
      {screen && (
        <>
          {screen.purpose && (
            <>
              <h2>Purpose</h2>
              <p>{screen.purpose}</p>
            </>
          )}
          <h2>Visible elements · top to bottom</h2>
          {elements.length ? (
            <ol>
              {elements.map((element) => (
                <li key={element.id}>
                  {element.name} ({title(element.type)})
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No elements yet.</p>
          )}
          <h2>What users can do</h2>
          {features.length ? (
            <ul>
              {features.map((feature) => (
                <li key={feature.id}>{describeFeature(project, feature)}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No behavior described yet.</p>
          )}
        </>
      )}
    </section>
  );
}
