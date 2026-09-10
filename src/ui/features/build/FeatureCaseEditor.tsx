import type {
  Element as SketchyElement,
  Feature,
  FeatureAction,
  Project,
} from "../../../shared";
import { post } from "../../plugin";
import styles from "./FeatureDetails.module.css";

export type CaseChanges = { condition?: string; description?: string };

const screenChoices = [
  ["navigate", "Go to screen"],
  ["overlay", "Open popup"],
  ["describe", "Stay on screen"],
] as const;
const popupChoices = [
  ["navigate", "Go to screen"],
  ["close-overlay", "Close popup"],
  ["describe", "Stay on screen"],
] as const;

export default function FeatureCaseEditor({
  project,
  element,
  feature,
  index,
  onSave,
}: {
  project: Project;
  element: SketchyElement;
  feature?: Feature;
  index: number;
  onSave: (
    feature: Feature | undefined,
    action: FeatureAction,
    changes?: CaseChanges,
  ) => void;
}) {
  const insidePopup =
    project.elements.find((item) => item.id === element.parentElementId)
      ?.role === "popup";
  const choices = insidePopup ? popupChoices : screenChoices;
  const action = feature?.action;
  const destinationAction =
    action?.type === "navigate" || action?.type === "overlay"
      ? action
      : undefined;
  const popupSection =
    destinationAction?.type === "overlay"
      ? project.elements.find(
          (item) =>
            item.screenId === destinationAction.destinationScreenId &&
            item.role === "popup",
        )
      : undefined;
  return (
    <fieldset className={styles.case}>
      <legend>
        {index ? `Case ${index + 1} · flow` : "Default · prototype"}
      </legend>
      {!!index && feature && (
        <label>
          When
          <input
            defaultValue={feature.condition || ""}
            placeholder="e.g. Cannot continue yet"
            onBlur={(event) =>
              onSave(feature, feature.action, {
                condition: event.target.value,
              })
            }
          />
        </label>
      )}
      <div className={styles.actions}>
        <span>What happens?</span>
        <div className={styles.choices}>
          {choices.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={action?.type === value}
              onClick={() => {
                if (action?.type === value) return;
                onSave(
                  feature,
                  value === "navigate"
                    ? { type: "navigate" }
                    : value === "overlay"
                      ? { type: "overlay" }
                      : value === "close-overlay"
                        ? { type: "close-overlay" }
                        : { type: "describe" },
                );
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {destinationAction && (
        <label>
          Destination
          <select
            value={destinationAction.destinationScreenId || ""}
            onChange={(event) =>
              onSave(feature, {
                ...destinationAction,
                destinationScreenId: event.target.value,
              })
            }
          >
            <option value="">Choose destination</option>
            {project.screens
              .filter(
                (item) =>
                  item.id !== element.screenId &&
                  (destinationAction.type === "overlay"
                    ? item.kind === "popup" &&
                      item.baseScreenId === element.screenId
                    : !item.kind),
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
      )}
      {popupSection && (
        <button
          type="button"
          onClick={() =>
            post({ type: "SELECT_ELEMENT", elementId: popupSection.id })
          }
        >
          Edit popup
        </button>
      )}
      {feature && (
        <label>
          {feature.action.type === "describe" ? "Outcome" : "Also happens"}
          <textarea
            defaultValue={feature.description || ""}
            placeholder={
              feature.action.type === "describe"
                ? "e.g. Keep the current selection"
                : "e.g. Save the choice"
            }
            onBlur={(event) =>
              onSave(feature, feature.action, {
                description: event.target.value,
              })
            }
          />
        </label>
      )}
      {feature && (
        <button
          type="button"
          className={styles.remove}
          onClick={() =>
            post({ type: "DELETE_FEATURE", featureId: feature.id })
          }
        >
          Remove case
        </button>
      )}
    </fieldset>
  );
}
