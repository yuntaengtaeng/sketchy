import styles from "./StringListField.module.css";

// Tabs의 tabItems, Select의 options가 공유하는 "문자열 목록 편집" 컨트롤,
// 4개 정형 컨트롤(Radio/Segmented/Select/Checkbox) 어디에도 안 맞는 목록
// 저작(authoring) 케이스라 별도로 둔다
export default function StringListField({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.rows}>
        {items.map((item, index) => (
          <div className={styles.row} key={index}>
            <input
              defaultValue={item}
              onBlur={(event) => {
                const next = [...items];
                next[index] = event.target.value.trim() || item;
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, `Item ${items.length + 1}`])}
      >
        + Add
      </button>
    </div>
  );
}
