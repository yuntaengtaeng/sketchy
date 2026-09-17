import type { Element as SketchyElement } from "../../../../shared";
import CheckedField from "../../../components/properties/CheckedField";
import { post } from "../../../plugin";

export default function CheckboxOptions({
  element,
}: {
  element: SketchyElement;
}) {
  const checked =
    element.type === "checkbox" ? (element.checked ?? false) : false;
  return (
    <CheckedField
      label="Checked"
      checked={checked}
      onChange={(value) =>
        post({ type: "SET_CHECKED", elementId: element.id, checked: value })
      }
    />
  );
}
