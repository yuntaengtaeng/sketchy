import type { Element as SketchyElement } from "../../../../shared";
import CheckedField from "../../../components/properties/CheckedField";
import { post } from "../../../plugin";

export default function SwitchOptions({
  element,
}: {
  element: SketchyElement;
}) {
  const checked =
    element.type === "switch" ? (element.checked ?? false) : false;
  return (
    <CheckedField
      label="On"
      checked={checked}
      onChange={(value) =>
        post({ type: "SET_CHECKED", elementId: element.id, checked: value })
      }
    />
  );
}
