import type { Element as SketchyElement } from "../../../../shared";
import SegmentedField from "../../../components/properties/SegmentedField";
import StringListField from "../../../components/properties/StringListField";
import { post } from "../../../plugin";

export default function TabsOptions({ element }: { element: SketchyElement }) {
  const items = element.type === "tabs" ? (element.tabItems ?? []) : [];
  const selectedTab =
    element.type === "tabs" ? (element.selectedTab ?? items[0]) : items[0];
  return (
    <>
      <StringListField
        label="Tabs"
        itemLabel="Tab"
        items={items}
        onChange={(next) =>
          post({ type: "SET_TAB_ITEMS", elementId: element.id, items: next })
        }
      />
      {items.length > 0 && (
        <SegmentedField
          label="Selected"
          value={selectedTab}
          options={items.map((item) => ({ value: item, label: item }))}
          onChange={(next) =>
            post({
              type: "SET_TAB_SELECTION",
              elementId: element.id,
              selectedTab: next,
            })
          }
        />
      )}
    </>
  );
}
