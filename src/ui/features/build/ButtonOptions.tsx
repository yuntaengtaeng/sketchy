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
  const layout =
    element.type === "button" ? (element.layout ?? "stretch") : "stretch";
  return (
    <>
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
      <SegmentedField
        label="Width"
        value={layout}
        options={[
          { value: "stretch", label: "Stretch" },
          { value: "start", label: "Left" },
          { value: "center", label: "Center" },
          { value: "end", label: "Right" },
        ]}
        onChange={(value) =>
          post({
            type: "SET_BUTTON_LAYOUT",
            elementId: element.id,
            layout: value,
          })
        }
      />
    </>
  );
}
