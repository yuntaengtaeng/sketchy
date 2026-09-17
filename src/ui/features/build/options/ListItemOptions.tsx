import type { Element as SketchyElement } from "../../../../shared";
import CountField from "../../../components/properties/CountField";
import SegmentedField from "../../../components/properties/SegmentedField";
import { post } from "../../../plugin";

export default function ListItemOptions({
  element,
}: {
  element: SketchyElement;
}) {
  const itemType =
    element.type === "listItem" ? (element.itemType ?? "basic") : "basic";
  const count = element.type === "listItem" ? (element.count ?? 3) : 3;
  return (
    <>
      <SegmentedField
        label="Type"
        value={itemType}
        options={[
          { value: "basic", label: "Basic" },
          { value: "leading", label: "Leading" },
          { value: "trailing", label: "Trailing" },
        ]}
        onChange={(value) =>
          post({
            type: "SET_LIST_ITEM_TYPE",
            elementId: element.id,
            itemType: value,
          })
        }
      />
      <CountField
        count={count}
        onChange={(value) =>
          post({ type: "SET_COUNT", elementId: element.id, count: value })
        }
      />
    </>
  );
}
