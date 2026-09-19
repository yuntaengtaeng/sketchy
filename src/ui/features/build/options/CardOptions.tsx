import type { Element as SketchyElement } from "../../../../shared";
import CountField from "../../../components/properties/CountField";
import InstanceFieldsField from "../../../components/properties/InstanceFieldsField";
import SegmentedField from "../../../components/properties/SegmentedField";
import { post } from "../../../plugin";

const CONTENT_FIELDS = {
  stat: [
    { key: "primary" as const, placeholder: "128" },
    { key: "secondary" as const, placeholder: "Label" },
  ],
  basic: [
    { key: "primary" as const, placeholder: "Title" },
    { key: "secondary" as const, placeholder: "Description" },
  ],
  media: [
    { key: "primary" as const, placeholder: "Title" },
    { key: "secondary" as const, placeholder: "Description" },
  ],
};

export default function CardOptions({ element }: { element: SketchyElement }) {
  const cardType =
    element.type === "card" ? (element.cardType ?? "basic") : "basic";
  const count = element.type === "card" ? (element.count ?? 3) : 3;
  const items = element.type === "card" ? element.items : undefined;
  return (
    <>
      <SegmentedField
        label="Type"
        value={cardType}
        options={[
          { value: "basic", label: "Basic" },
          { value: "media", label: "Media" },
          { value: "stat", label: "Stat" },
        ]}
        onChange={(value) =>
          post({
            type: "SET_CARD_TYPE",
            elementId: element.id,
            cardType: value,
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
        fields={CONTENT_FIELDS[cardType]}
        onChange={(next) =>
          post({ type: "SET_CARD_CONTENT", elementId: element.id, items: next })
        }
      />
    </>
  );
}
