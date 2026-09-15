import type { Element as SketchyElement } from "../../../shared";
import SegmentedField from "../../components/properties/SegmentedField";
import StringListField from "../../components/properties/StringListField";
import { post } from "../../plugin";

export default function SelectOptions({
  element,
}: {
  element: SketchyElement;
}) {
  const options = element.type === "select" ? (element.options ?? []) : [];
  const displayState =
    element.type === "select"
      ? (element.displayState ?? "collapsed")
      : "collapsed";
  return (
    <>
      <StringListField
        label="Options"
        itemLabel="Option"
        items={options}
        onChange={(next) =>
          post({
            type: "SET_SELECT_OPTIONS",
            elementId: element.id,
            options: next,
          })
        }
      />
      <SegmentedField
        label="Display"
        value={displayState}
        options={[
          { value: "collapsed", label: "Collapsed" },
          { value: "expanded", label: "Expanded" },
        ]}
        onChange={(value) =>
          post({
            type: "SET_SELECT_DISPLAY_STATE",
            elementId: element.id,
            displayState: value,
          })
        }
      />
    </>
  );
}
