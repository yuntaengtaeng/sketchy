import { useState } from "react";
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
  // navigate는 overlay와 달리 목적지가 없으면 자동으로 만들어주지 않으므로,
  // "Go to screen"을 누른 직후 목적지를 아직 안 고른 상태로 바로 저장을
  // 시도하면 매번 "Select a destination screen" 오류가 뜬다. 목적지를
  // 고를 때까지는 저장하지 않고 이 draft 상태로만 선택 UI를 보여준다.
  const [draftingNavigate, setDraftingNavigate] = useState(false);
  const destinationAction =
    action?.type === "navigate" || action?.type === "overlay"
      ? action
      : draftingNavigate
        ? { type: "navigate" as const }
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
              aria-pressed={
                action?.type === value ||
                (value === "navigate" && draftingNavigate)
              }
              onClick={() => {
                if (action?.type === value) return;
                if (value === "navigate") {
                  setDraftingNavigate(true);
                  return;
                }
                setDraftingNavigate(false);
                onSave(
                  feature,
                  value === "overlay"
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
            onChange={(event) => {
              if (!event.target.value) return;
              setDraftingNavigate(false);
              onSave(feature, {
                ...destinationAction,
                destinationScreenId: event.target.value,
              });
            }}
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
