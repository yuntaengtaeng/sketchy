import type { Element as SketchyElement } from "../../../../shared";
import CountField from "../../../components/properties/CountField";
import InstanceFieldsField from "../../../components/properties/InstanceFieldsField";
import SegmentedField from "../../../components/properties/SegmentedField";
import { post } from "../../../plugin";

const CONTENT_FIELDS = {
  basic: [
    { key: "title" as const, placeholder: "Title" },
    { key: "subtitle" as const, placeholder: "Subtitle" },
  ],
  leading: [
    { key: "title" as const, placeholder: "Title" },
    { key: "subtitle" as const, placeholder: "Subtitle" },
  ],
  trailing: [
    { key: "title" as const, placeholder: "Title" },
    { key: "subtitle" as const, placeholder: "Subtitle" },
    { key: "value" as const, placeholder: "Value" },
  ],
};

export default function ListItemOptions({
  element,
}: {
  element: SketchyElement;
}) {
  const itemType =
    element.type === "listItem" ? (element.itemType ?? "basic") : "basic";
  const count = element.type === "listItem" ? (element.count ?? 3) : 3;
  const items = element.type === "listItem" ? element.items : undefined;
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
      <InstanceFieldsField
        label="Content"
        count={count}
        items={items}
        fields={CONTENT_FIELDS[itemType]}
        onChange={(next) =>
          post({
            type: "SET_LIST_ITEM_CONTENT",
            elementId: element.id,
            items: next,
          })
        }
      />
    </>
  );
}
