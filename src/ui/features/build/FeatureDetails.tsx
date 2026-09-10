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
            if (
              feature &&
              event.target.value !== feature.action.type &&
              !confirm("Replace this button's current action?")
            )
              return;
            if (event.target.value === "describe")
              post({
                type: "SAVE_FEATURE",
                sourceElementId: element.id,
                action: {
                  type: "describe",
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
          <option value="navigate">Go to screen (prototype)</option>
          <option value="describe">Describe outcome (spec only)</option>
        </select>
      </label>
      {feature?.action.type === "navigate" && (
        <>
          <p className="muted">
            For a visible state, create a separate screen and link to it. This
            works on every Figma plan.
          </p>
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
          <label>
            Notes (spec only)
            <textarea
              defaultValue={element.description || ""}
              placeholder="e.g. Save the choice, then show the selected state"
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
        </>
      )}
      {feature?.action.type === "describe" && (
        <label>
          Outcome
          <textarea
            defaultValue={element.description || ""}
            placeholder="e.g. Save this item to favorites (not prototyped)"
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
