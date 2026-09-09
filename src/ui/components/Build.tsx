import type {
  BlockType,
  Element as SketchyElement,
  Project,
  Screen,
} from "../../shared";
import { post } from "../plugin";
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
        <>
          <section key={screen.id}>
            <h2>Screen details</h2>
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
          </section>
          <section>
            <h2>Add something</h2>
            <div className={styles.blocks}>
              {(["text", "button", "input"] as BlockType[]).map((block) => (
                <button
                  key={block}
                  onClick={() =>
                    post({
                      type: "INSERT_BLOCK",
                      screenId: screen.id,
                      block,
                    })
                  }
                >
                  {block}
                </button>
              ))}
            </div>
          </section>
        </>
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
            <>
              <label>
                Description
                <textarea
                  defaultValue={element.description || ""}
                  placeholder="What happens when users click?"
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
              <label>
                Go to
                <select
                  defaultValue={
                    project.interactions.find(
                      (item) => item.sourceElementId === element.id,
                    )?.destinationScreenId || ""
                  }
                  onChange={(event) =>
                    event.target.value &&
                    post({
                      type: "CREATE_INTERACTION",
                      sourceElementId: element.id,
                      destinationScreenId: event.target.value,
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
            </>
          )}
        </section>
      )}
    </>
  );
}
