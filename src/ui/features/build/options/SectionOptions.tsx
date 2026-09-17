import type { Element as SketchyElement } from "../../../../shared";
import { post } from "../../../plugin";

export default function SectionOptions({
  element,
}: {
  element: SketchyElement;
}) {
  const direction = element.type === "section" ? element.direction : "vertical";
  return (
    <label>
      Direction
      <select
        value={direction || "vertical"}
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
  );
}
