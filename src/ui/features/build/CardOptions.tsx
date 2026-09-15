import type { Element as SketchyElement } from "../../../shared";
import CountField from "../../components/properties/CountField";
import SegmentedField from "../../components/properties/SegmentedField";
import { post } from "../../plugin";

export default function CardOptions({ element }: { element: SketchyElement }) {
  const cardType =
    element.type === "card" ? (element.cardType ?? "basic") : "basic";
  const count = element.type === "card" ? (element.count ?? 3) : 3;
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
    </>
  );
}
