import type { Element as SketchyElement, Project } from "../../../shared";
import { post } from "../../plugin";

export default function FeatureDetails({
  project,
  element,
}: {
  project: Project;
  element: SketchyElement;
}) {
  const feature = project.features.find(
    (item) => item.trigger?.elementId === element.id,
  );
  return (
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
  );
}
