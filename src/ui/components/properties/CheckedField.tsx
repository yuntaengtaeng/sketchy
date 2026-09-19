import Field from "../Field/Field";

// Checkbox/Radio/Switch가 공유하는 독립적 켜기/끄기 컨트롤, 라벨만 블록마다
// 다르게 준다 (Checked/Selected/On)
export default function CheckedField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Field layout="row">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </Field>
  );
}
