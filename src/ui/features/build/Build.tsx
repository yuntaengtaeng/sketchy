import type {
  BlockType,
  Element as SketchyElement,
  Project,
  Screen,
} from "../../../shared";
import { BLOCK_TRIGGERS } from "../../../shared";
import { post } from "../../plugin";
import styles from "./Build.module.css";

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
  const feature = element
    ? project.features.find((item) => item.trigger?.elementId === element.id)
    : undefined;
  return (
    <>
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

      {screen && (
        <section>
          <h2>Add something</h2>
          <div className={styles.blocks}>
            {(["text", "button", "input"] as BlockType[]).map((block) => (
              <button
                className={styles.block}
                data-block={block}
                key={block}
                onClick={() =>
                  post({ type: "INSERT_BLOCK", screenId: screen.id, block })
                }
              >
                <span className={styles.preview} aria-hidden="true">
                  {block === "text" && "Aa"}
                </span>
                <span>{block}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {element && (
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
          {BLOCK_TRIGGERS[element.type].includes("click") && (
            <>
              <label>
                What happens?
                <select
                  value={feature?.action.type || ""}
                  onChange={(event) => {
                    if (event.target.value === "set-state")
                      post({
                        type: "SAVE_FEATURE",
                        sourceElementId: element.id,
                        action: {
                          type: "set-state",
                          stateName: element.name,
                          value: true,
                        },
                      });
                    if (event.target.value === "navigate")
                      post({
                        type: "SAVE_FEATURE",
                        sourceElementId: element.id,
                        action: { type: "navigate" },
                      });
                  }}
                >
                  <option value="">Choose action</option>
                  <option value="navigate">Go to screen</option>
                  <option value="set-state">Change state</option>
                </select>
              </label>
              {feature?.action.type === "navigate" && (
                <label>
                  Destination
                  <select
                    value={feature.action.destinationScreenId || ""}
                    onChange={(event) =>
                      post({
                        type: "SAVE_FEATURE",
                        sourceElementId: element.id,
                        action: {
                          type: "navigate",
                          destinationScreenId: event.target.value,
                        },
                      })
                    }
                  >
                    <option value="">Choose destination</option>
                    {project.screens
                      .filter((item) => item.id !== element.screenId)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {feature?.action.type === "set-state" && (
                <label>
                  When clicked
                  <textarea
                    defaultValue={element.description || ""}
                    placeholder="e.g. Add this item to favorites"
                    onBlur={(event) =>
                      post({
                        type: "UPDATE_ELEMENT",
                        elementId: element.id,
                        name: element.name,
                        description: event.target.value,
                      })
                    }
                  />
                </label>
              )}
            </>
          )}
          <button
            className={styles.delete}
            onClick={() =>
              post({ type: "DELETE_ELEMENT", elementId: element.id })
            }
          >
            Delete
          </button>
        </section>
      )}

      {screen && (
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
          </details>
        </section>
      )}
    </>
  );
}
