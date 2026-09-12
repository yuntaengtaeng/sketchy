import type { Project, Screen } from "../../../shared";
import { post } from "../../plugin";
import BlockPicker from "./BlockPicker";
import styles from "./Build.module.css";
import NodeList from "./NodeList";

export function ScreenBrowser({ project }: { project: Project }) {
  return (
    <section>
      <h2>Screens</h2>
      <div className={styles.screenPicker}>
        <ScreenSelect project={project} />
        <NewScreen project={project} />
      </div>
    </section>
  );
}

export default function ScreenEditor({
  project,
  screen,
}: {
  project: Project;
  screen: Screen;
}) {
  const derivedStates = project.screens.filter(
    (item) => item.baseScreenId === screen.id,
  );
  const removedScreenIds = new Set([
    screen.id,
    ...derivedStates.map((item) => item.id),
  ]);
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
  const nodes = project.elements
    .filter(
      (element) => element.screenId === screen.id && !element.parentElementId,
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <>
      <section>
        <h2>{screen.kind ? "State" : "Screen"}</h2>
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
      <BlockPicker screenId={screen.id} />
      <NodeList title={`Inside ${screen.name}`} nodes={nodes} />
      <section>
        <h2>Other screens</h2>
        <div className={styles.screenPicker}>
          <ScreenSelect project={project} screen={screen} />
          <NewScreen project={project} />
        </div>
        {!screen.kind && (
          <button
            className={styles.secondaryAction}
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
      </section>
    </>
  );
}

function ScreenSelect({
  project,
  screen,
}: {
  project: Project;
  screen?: Screen;
}) {
  return (
    <select
      aria-label="Select screen"
      value={screen?.id || ""}
      onChange={(event) =>
        post({ type: "SELECT_SCREEN", screenId: event.target.value })
      }
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
  );
}

function NewScreen({ project }: { project: Project }) {
  return (
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
  );
}
