import type { Element as SketchyElement } from "../../../shared";
import CheckedField from "../../components/properties/CheckedField";
import { post } from "../../plugin";

export default function RadioOptions({ element }: { element: SketchyElement }) {
  const checked = element.type === "radio" ? (element.checked ?? false) : false;
  return (
    <CheckedField
      label="Selected"
      checked={checked}
      onChange={(value) =>
        post({ type: "SET_CHECKED", elementId: element.id, checked: value })
      }
    />
  );
}
