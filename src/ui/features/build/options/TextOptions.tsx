import type { Element as SketchyElement } from "../../../../shared";
import SegmentedField from "../../../components/properties/SegmentedField";
import { post } from "../../../plugin";

type TextSize = "display" | "title" | "subtitle" | "body" | "caption";

const SIZES: { value: TextSize; label: string }[] = [
  { value: "display", label: "Display" },
  { value: "title", label: "Title" },
  { value: "subtitle", label: "Subtitle" },
  { value: "body", label: "Body" },
  { value: "caption", label: "Caption" },
];

export default function TextOptions({ element }: { element: SketchyElement }) {
  const size = element.type === "text" ? (element.textSize ?? "body") : "body";
  return (
    <SegmentedField
      label="Size"
      value={size}
      options={SIZES}
      onChange={(value) =>
        post({ type: "SET_TEXT_SIZE", elementId: element.id, size: value })
      }
    />
  );
}
