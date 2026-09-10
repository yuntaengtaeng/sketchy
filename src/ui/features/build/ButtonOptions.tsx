import type { Element as SketchyElement } from "../../../shared";
import { post } from "../../plugin";

export default function ButtonOptions({
  element,
}: {
  element: SketchyElement;
}) {
  return (
    <label>
      Style
      <select
        value={element.buttonVariant || "filled"}
        onChange={(event) =>
          post({
            type: "SET_BUTTON_VARIANT",
            elementId: element.id,
            variant: event.target.value as "filled" | "outline",
          })
        }
      >
        <option value="filled">Filled</option>
        <option value="outline">Outline</option>
      </select>
    </label>
  );
}
