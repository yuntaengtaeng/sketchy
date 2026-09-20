import {
  defaultSectionDirection,
  isContainerElement,
  type Element as SketchyElement,
} from "../../../../shared";
import { post } from "../../../plugin";
import Field from "../../../components/Field/Field";
import Select from "../../../components/Select/Select";

// Section/Footer 공용, 컨테이너 안 배치 방향 선택, Header는 항상 가로 고정이라 제외
export default function LayoutDirectionOptions({
  element,
}: {
  element: SketchyElement;
}) {
  const direction = isContainerElement(element)
    ? element.direction || defaultSectionDirection(element.type)
    : defaultSectionDirection(element.type);
  return (
    <Field>
      Direction
      <Select
        value={direction}
        onChange={(event) =>
          post({
            type: "SET_SECTION_DIRECTION",
            elementId: element.id,
            direction: event.target.value as "vertical" | "horizontal",
          })
        }
      >
        <option value="vertical">Vertical ↓</option>
        <option value="horizontal">Horizontal →</option>
      </Select>
    </Field>
  );
}
