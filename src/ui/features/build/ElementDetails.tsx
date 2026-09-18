import type { Element as SketchyElement, Project } from "../../../shared";
import { BLOCK_DEFINITIONS } from "../../../shared";
import { post } from "../../plugin";
import { BLOCK_OPTIONS } from "./blockRegistry";
import styles from "./ElementDetails.module.css";
import FeatureDetails from "./FeatureDetails";
import { OnboardingTarget } from "./OnboardingCoachmark";

export default function ElementDetails({
  project,
  element,
  onboarding = false,
}: {
  project: Project;
  element: SketchyElement;
  onboarding?: boolean;
}) {
  const Options = BLOCK_OPTIONS[element.type];
  const screen = project.screens.find((item) => item.id === element.screenId);
  const insidePopup =
    project.elements.find((item) => item.id === element.parentElementId)
      ?.role === "popup";
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
      <label>
        Description
        <textarea
          defaultValue={element.description}
          placeholder="What does this show or contain?"
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
      {Options && <Options element={element} />}
      {BLOCK_DEFINITIONS[element.type].triggers.length > 0 ? (
        (!screen?.kind || insidePopup) && (
          <OnboardingTarget active={onboarding}>
            <FeatureDetails project={project} element={element} />
          </OnboardingTarget>
        )
      ) : (
        <p className={`muted ${styles.noInteraction}`}>
          This element doesn't support interactions.
        </p>
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
