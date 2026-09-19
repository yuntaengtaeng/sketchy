import { useState } from "react";
import type {
  Element as SketchyElement,
  Feature,
  FeatureAction,
  Project,
} from "../../../../shared";
import { post } from "../../../plugin";
import styles from "./FeatureDetails.module.css";

export type CaseChanges = { condition?: string; description?: string };

const screenChoices = [
  ["navigate", "Go to screen"],
  ["overlay", "Open popup"],
  ["toast", "Show toast"],
  ["describe", "Describe result"],
] as const;
const popupChoices = [
  ["navigate", "Go to screen"],
  ["close-overlay", "Close popup"],
  ["toast", "Show toast"],
  ["describe", "Describe result"],
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
  // draft 중엔 항상 navigate 하나만 눌린 것으로 취급, 그렇지 않으면 이전
  // 결과와 draft 상태가 동시에 눌려 보인다
  const activeChoice = draftingNavigate ? "navigate" : action?.type;
  const destinationAction =
    action?.type === "navigate" ||
    action?.type === "overlay" ||
    action?.type === "toast"
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
  const toastMessageElement =
    destinationAction?.type === "toast"
      ? project.elements.find(
          (item) =>
            item.screenId === destinationAction.destinationScreenId &&
            item.type === "text",
        )
      : undefined;
  return (
    <fieldset className={styles.case}>
      <legend>
        {index ? (
          <>
            {/* Flow/Canvas의 조건부 연결선과 같은 점선으로, 이 케이스는
            실제로 눌러도 재생되지 않고 Flow·Spec에만 표시된다는 걸 알린다 */}
            <span className={styles.flowMark} aria-hidden="true" />
            {`Outcome ${index + 1} · Flow and Spec only`}
          </>
        ) : (
          "When clicked"
        )}
      </legend>
      {!!index && feature && (
        <label>
          If
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
        <span>Result</span>
        <div className={styles.choices}>
          {choices.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={activeChoice === value}
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
                      : value === "toast"
                        ? { type: "toast" }
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
                    : destinationAction.type === "toast"
                      ? item.kind === "toast" &&
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
      {toastMessageElement && (
        <button
          type="button"
          onClick={() =>
            post({ type: "SELECT_ELEMENT", elementId: toastMessageElement.id })
          }
        >
          Edit toast message
        </button>
      )}
      {feature && (
        <label>
          {feature.action.type === "describe"
            ? "What happens?"
            : "Additional result"}
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
          Remove outcome
        </button>
      )}
    </fieldset>
  );
}
