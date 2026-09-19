import Field from "../Field/Field";
import TextInput from "../TextInput/TextInput";

// List Item/Card/Table이 공유하는 반복 개수 컨트롤, 정해진 소수의 배타적
// 선택이 아니라 작은 범위의 숫자라 Segmented 대신 숫자 입력을 쓴다
export default function CountField({
  count,
  onChange,
  min = 1,
  max = 6,
}: {
  count: number;
  onChange: (count: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <Field>
      Rows
      <TextInput
        type="number"
        min={min}
        max={max}
        defaultValue={count}
        onBlur={(event) => {
          const next = Math.min(
            max,
            Math.max(min, Math.round(Number(event.target.value)) || count),
          );
          event.target.value = String(next);
          if (next !== count) onChange(next);
        }}
      />
    </Field>
  );
}
