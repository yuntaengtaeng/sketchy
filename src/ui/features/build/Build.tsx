import type {
  Element as SketchyElement,
  Project,
  Screen,
} from "../../../shared";
import { post } from "../../plugin";
import BlockPicker from "./BlockPicker";
import styles from "./Build.module.css";
import ElementDetails from "./ElementDetails";
import SectionEditor from "./SectionEditor";

type Props = {
  project: Project;
  screen?: Screen;
  element?: SketchyElement;
  onScreenChange: (screenId: string) => void;
};

export default function Build({
  project,
  screen,
  element,
  onScreenChange,
}: Props) {
  const section =
    element?.type === "section"
      ? element
      : project.elements.find((item) => item.id === element?.parentElementId);
  return (
    <>
      {!section && (
        <section>
          <h2>Screens</h2>
          <div className={styles.screenPicker}>
            <select
              value={screen?.id || ""}
              onChange={(event) => {
                onScreenChange(event.target.value);
                post({ type: "SELECT_SCREEN", screenId: event.target.value });
              }}
            >
              <option value="">Select a screen</option>
              {project.screens.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                post({
                  type: "CREATE_SCREEN",
                  name: `Screen ${project.screens.length + 1}`,
                })
              }
            >
              + Screen
            </button>
          </div>
        </section>
      )}

      {screen &&
        (section ? (
          <SectionEditor
            project={project}
            screenId={screen.id}
            section={section}
            selectedElementId={element?.id}
          />
        ) : (
          <BlockPicker screenId={screen.id} />
        ))}
      {element && <ElementDetails project={project} element={element} />}

      {screen && !section && (
        <section key={screen.id}>
          <details className={`${styles.more} ${styles.screenDetails}`}>
            <summary>Screen details</summary>
            <label>
              Name
              <input
                defaultValue={screen.name}
                onBlur={(event) =>
                  post({
                    type: "UPDATE_SCREEN",
                    screenId: screen.id,
                    name: event.target.value,
                    purpose: screen.purpose,
                  })
                }
              />
            </label>
            <label>
              Purpose
              <textarea
                defaultValue={screen.purpose}
                placeholder="What can users do here?"
                onBlur={(event) =>
                  post({
                    type: "UPDATE_SCREEN",
                    screenId: screen.id,
                    name: screen.name,
                    purpose: event.target.value,
                  })
                }
              />
            </label>
            <button
              onClick={() =>
                post({ type: "DUPLICATE_SCREEN", screenId: screen.id })
              }
            >
              Duplicate screen
            </button>
            <button
              className={styles.delete}
              onClick={() =>
                confirm(`Delete ${screen.name}? This cannot be undone.`) &&
                post({ type: "DELETE_SCREEN", screenId: screen.id })
              }
            >
              Delete screen
            </button>
          </details>
        </section>
      )}
    </>
  );
}
