import type { Element as SketchyElement } from "../../../../shared";
import { post } from "../../../plugin";
import Field from "../../../components/Field/Field";
import TextInput from "../../../components/TextInput/TextInput";

export default function InputOptions({ element }: { element: SketchyElement }) {
  const placeholder = element.type === "input" ? element.placeholder : "";
  return (
    <Field>
      Placeholder
      <TextInput
        defaultValue={placeholder}
        placeholder="Type here..."
        onBlur={(event) =>
          post({
            type: "SET_INPUT_PLACEHOLDER",
            elementId: element.id,
            placeholder: event.target.value,
          })
        }
      />
    </Field>
  );
}
