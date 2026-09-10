import type { Project, Screen } from "../../../shared";
import {
  describeFeature,
  outlineElements,
  title,
  type ElementOutline,
} from "./describe";
import styles from "./Spec.module.css";

export default function Spec({
  project,
  screen,
}: {
  project: Project;
  screen?: Screen;
}) {
  const elements = project.elements.filter(
    (element) => element.screenId === screen?.id,
  );
  const outline = outlineElements(elements);
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
          {outline.length ? (
            <ElementList items={outline} />
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

function ElementList({ items }: { items: ElementOutline[] }) {
  return (
    <ol className={styles.elements}>
      {items.map(({ element, number, children }) => (
        <li key={element.id}>
          <span>
            {number}. {element.name} ({title(element.type)})
          </span>
          {!!children.length && <ElementList items={children} />}
        </li>
      ))}
    </ol>
  );
}
