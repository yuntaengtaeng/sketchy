import type { Element as SketchyElement, Project } from "../../../shared";
import { BLOCK_DEFINITIONS } from "../../../shared";
import { post } from "../../plugin";
import { BLOCK_OPTIONS } from "./blockRegistry";
import styles from "./Build.module.css";
import FeatureDetails from "./FeatureDetails";

export default function ElementDetails({
  project,
  element,
}: {
  project: Project;
  element: SketchyElement;
}) {
  const Options = BLOCK_OPTIONS[element.type];
  return (
    <section key={element.id}>
      <h2>{element.type} details</h2>
      <label>
        Name
        <input
          defaultValue={element.name}
          onBlur={(event) =>
            post({
              type: "UPDATE_ELEMENT",
              elementId: element.id,
              name: event.target.value,
              description: element.description || "",
            })
          }
        />
      </label>
      {Options && <Options element={element} />}
      {BLOCK_DEFINITIONS[element.type].triggers.length > 0 && (
        <FeatureDetails project={project} element={element} />
      )}
      {element.role !== "popup" && (
        <button
          className={styles.delete}
          onClick={() =>
            post({ type: "DELETE_ELEMENT", elementId: element.id })
          }
        >
          Delete
        </button>
      )}
    </section>
  );
}
