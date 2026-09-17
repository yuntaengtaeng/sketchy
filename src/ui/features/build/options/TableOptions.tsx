import type { Element as SketchyElement } from "../../../../shared";
import CountField from "../../../components/properties/CountField";
import StringListField from "../../../components/properties/StringListField";
import { post } from "../../../plugin";

export default function TableOptions({ element }: { element: SketchyElement }) {
  const columns =
    element.type === "table"
      ? (element.columns ?? ["Column 1", "Column 2", "Column 3"])
      : [];
  const count = element.type === "table" ? (element.count ?? 3) : 3;
  return (
    <>
      <StringListField
        label="Columns"
        itemLabel="Column"
        items={columns}
        onChange={(next) =>
          post({
            type: "SET_TABLE_COLUMNS",
            elementId: element.id,
            columns: next,
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
