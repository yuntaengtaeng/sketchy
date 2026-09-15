import type { Element as SketchyElement } from "../../../shared";
import StringListField from "../../components/properties/StringListField";
import { post } from "../../plugin";

export default function TabsOptions({ element }: { element: SketchyElement }) {
  const items = element.type === "tabs" ? (element.tabItems ?? []) : [];
  return (
    <StringListField
      label="Tabs"
      itemLabel="Tab"
      items={items}
      onChange={(next) =>
        post({ type: "SET_TAB_ITEMS", elementId: element.id, items: next })
      }
    />
  );
}
