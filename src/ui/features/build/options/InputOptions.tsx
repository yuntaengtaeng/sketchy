import type { Element as SketchyElement } from "../../../../shared";
import { post } from "../../../plugin";

export default function InputOptions({ element }: { element: SketchyElement }) {
  const placeholder = element.type === "input" ? element.placeholder : "";
  return (
    <label>
      Placeholder
      <input
        defaultValue={placeholder}
        placeholder="Type here..."
        onBlur={(event) =>
          post({
            type: "SET_INPUT_PLACEHOLDER",
            elementId: element.id,
            placeholder: event.target.value,
          })
        }
      />
    </label>
  );
}
