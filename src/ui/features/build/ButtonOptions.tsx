import type { Element as SketchyElement } from "../../../shared";
import SegmentedField from "../../components/properties/SegmentedField";
import { post } from "../../plugin";

export default function ButtonOptions({
  element,
}: {
  element: SketchyElement;
}) {
  const variant =
    element.type === "button" ? (element.buttonVariant ?? "filled") : "filled";
  return (
    <SegmentedField
      label="Style"
      value={variant}
      options={[
        { value: "filled", label: "Filled" },
        { value: "outline", label: "Outline" },
      ]}
      onChange={(value) =>
        post({
          type: "SET_BUTTON_VARIANT",
          elementId: element.id,
          variant: value,
        })
      }
    />
  );
}
