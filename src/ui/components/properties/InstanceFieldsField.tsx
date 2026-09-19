import { useState } from "react";
import TextInput from "../TextInput/TextInput";
import CheckedField from "./CheckedField";
import styles from "./StringListField.module.css";
import ownStyles from "./InstanceFieldsField.module.css";

/** Card/List Item 공용 인스턴스별 필드 입력, count는 CountField가 따로 관리 */
export default function InstanceFieldsField<K extends string>({
  label,
  count,
  items,
  fields,
  onChange,
}: {
  label: string;
  count: number;
  items: Partial<Record<K, string>>[] | undefined;
  fields: { key: K; placeholder: string }[];
  onChange: (items: Partial<Record<K, string>>[]) => void;
}) {
  const [sameForAll, setSameForAll] = useState(true);
  const rows = Array.from(
    { length: count },
    (_, index) => items?.[index] ?? ({} as Partial<Record<K, string>>),
  );
  const updateOne = (index: number, key: K, value: string) =>
    onChange(
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  const updateAll = (key: K, value: string) =>
    onChange(rows.map((row) => ({ ...row, [key]: value })));

  const visibleRows = sameForAll ? rows.slice(0, 1) : rows;

  return (
    <div className={styles.field}>
      <div className={ownStyles.header}>
        <span className={styles.label}>{label}</span>
        <CheckedField
          label="Same for all"
          checked={sameForAll}
          onChange={setSameForAll}
        />
      </div>
      <div className={styles.rows}>
        {visibleRows.map((row, index) => (
          <div className={ownStyles.instance} key={index}>
            {fields.map((field) => (
              <TextInput
                key={field.key}
                defaultValue={row[field.key] ?? ""}
                placeholder={field.placeholder}
                onBlur={(event) =>
                  sameForAll
                    ? updateAll(field.key, event.target.value)
                    : updateOne(index, field.key, event.target.value)
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
