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

const blocks: { label: string; block: BlockType }[] = [
  { label: "Text", block: "text" },
  { label: "Button", block: "button" },
  { label: "Input", block: "input" },
  { label: "Image", block: "image" },
  { label: "Divider", block: "divider" },
  { label: "Section", block: "section" },
];

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
  const feature = element
    ? project.features.find((item) => item.trigger?.elementId === element.id)
    : undefined;
  return (
    <>
      {section && screen ? (
        <section className={styles.sectionHeader}>
          <button
            className={styles.back}
            onClick={() => post({ type: "SELECT_SCREEN", screenId: screen.id })}
          >
            ← {screen.name}
          </button>
          <small>Editing section</small>
          <h2>{section.name}</h2>
          <p className="muted">New elements are added inside this section.</p>
        </section>
      ) : (
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

      {screen && (
        <section className={section ? styles.sectionCanvas : undefined}>
          <h2>{section ? "Add to section" : "Add something"}</h2>
          <div className={styles.blocks}>
            {blocks
              .filter(({ block }) => !section || block !== "section")
              .map(({ label, block }) => (
                <button
                  className={styles.block}
                  data-block={block}
                  key={label}
                  onClick={() =>
                    post({
                      type: "INSERT_BLOCK",
                      screenId: screen.id,
                      block,
                      parentElementId: section?.id,
                    })
                  }
                >
                  <span className={styles.preview} aria-hidden="true">
                    {block === "text" && "Aa"}
                  </span>
                  <span>{label}</span>
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
          {element.type === "button" && (
            <label>
              Style
              <select
                value={element.buttonVariant || "filled"}
                onChange={(event) =>
                  post({
                    type: "SET_BUTTON_VARIANT",
                    elementId: element.id,
                    variant: event.target.value as "filled" | "outline",
                  })
                }
              >
                <option value="filled">Filled</option>
                <option value="outline">Outline</option>
              </select>
            </label>
          )}
          {element.type === "section" && (
            <label>
              Direction
              <select
                value={element.direction || "vertical"}
                onChange={(event) =>
                  post({
                    type: "SET_SECTION_DIRECTION",
                    elementId: element.id,
                    direction: event.target.value as "vertical" | "horizontal",
                  })
                }
              >
                <option value="vertical">Vertical ↓</option>
                <option value="horizontal">Horizontal →</option>
              </select>
            </label>
          )}
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
          </details>
        </section>
      )}
    </>
  );
}
