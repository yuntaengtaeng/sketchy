import type {
  Element as SketchyElement,
  Feature,
  FeatureAction,
  Project,
} from "../../../shared";
import { post } from "../../plugin";
import FeatureCaseEditor, { type CaseChanges } from "./FeatureCaseEditor";

export default function FeatureDetails({
  project,
  element,
}: {
  project: Project;
  element: SketchyElement;
}) {
  const features = project.features.filter(
    (item) => item.trigger?.elementId === element.id,
  );
  const save = (
    feature: Feature | undefined,
    action: FeatureAction,
    changes: CaseChanges = {},
  ) =>
    post({
      type: "SAVE_FEATURE",
      sourceElementId: element.id,
      featureId: feature?.id,
      condition: changes.condition ?? feature?.condition,
      description: changes.description ?? feature?.description,
      action,
    });
  return (
    <>
      {(features.length ? features : [undefined]).map((feature, index) => (
        <FeatureCaseEditor
          key={feature?.id || "new"}
          project={project}
          element={element}
          feature={feature}
          index={index}
          onSave={save}
        />
      ))}
      {!!features.length && (
        <button
          type="button"
          onClick={() => save(undefined, { type: "describe" })}
        >
          + Add case
        </button>
      )}
    </>
  );
}
