import styles from "./SegmentedField.module.css";

// 고정된 소수의 배타적 선택에 쓰는 공용 컨트롤 (TextSize, Button Width, Select
// Display 등), Interaction UI 원칙: 이런 선택은 select가 아니라 Segmented
export default function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label>
      {label}
      <div className={styles.segmented}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </label>
  );
}
