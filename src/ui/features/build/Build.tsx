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
  const derivedStates = screen
    ? project.screens.filter((item) => item.baseScreenId === screen.id)
    : [];
  const removedScreenIds = new Set(
    [screen?.id, ...derivedStates.map((item) => item.id)].filter(
      (id): id is string => !!id,
    ),
  );
  const incomingConnections = project.features.filter(
    (feature) =>
      "destinationScreenId" in feature.action &&
      !!feature.action.destinationScreenId &&
      removedScreenIds.has(feature.action.destinationScreenId),
  ).length;
  const deleteImpact = [
    derivedStates.length
      ? `${derivedStates.length} derived ${derivedStates.length === 1 ? "state" : "states"}`
      : "",
    incomingConnections
      ? `${incomingConnections} incoming ${incomingConnections === 1 ? "connection" : "connections"}`
      : "",
  ]
    .filter(Boolean)
    .join(" and ");
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
              <optgroup label="Screens">
                {project.screens
                  .filter((item) => !item.kind)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </optgroup>
              {!!project.screens.some((item) => item.kind) && (
                <optgroup label="States">
                  {project.screens
                    .filter((item) => item.kind)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
            <button
              onClick={() =>
                post({
                  type: "CREATE_SCREEN",
                  name: `Screen ${project.screens.filter((screen) => !screen.kind).length + 1}`,
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
            <summary>
              {screen.kind ? "State details" : "Screen details"}
            </summary>
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
            {!screen.kind && (
              <button
                onClick={() =>
                  post({ type: "DUPLICATE_SCREEN", screenId: screen.id })
                }
              >
                Duplicate screen
              </button>
            )}
            <button
              className={styles.delete}
              onClick={() =>
                confirm(
                  `Delete ${screen.name}?${deleteImpact ? ` This also removes ${deleteImpact}.` : ""} This cannot be undone.`,
                ) && post({ type: "DELETE_SCREEN", screenId: screen.id })
              }
            >
              Delete {screen.kind ? "state" : "screen"}
            </button>
          </details>
        </section>
      )}
    </>
  );
}
