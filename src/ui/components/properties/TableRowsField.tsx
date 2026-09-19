import { useState } from "react";
import TextInput from "../TextInput/TextInput";
import CheckedField from "./CheckedField";
import styles from "./StringListField.module.css";
import ownStyles from "./InstanceFieldsField.module.css";

/** Table 전용 행 편집 그리드, count와 columns 길이에 맞춰 셀을 나열 */
export default function TableRowsField({
  columns,
  count,
  rows,
  onChange,
}: {
  columns: string[];
  count: number;
  rows: string[][] | undefined;
  onChange: (rows: string[][]) => void;
}) {
  const [sameForAll, setSameForAll] = useState(true);
  const data = Array.from({ length: count }, (_, index) => rows?.[index] ?? []);
  const updateOne = (rowIndex: number, columnIndex: number, value: string) =>
    onChange(
      data.map((row, r) =>
        r === rowIndex
          ? columns.map((_, c) => (c === columnIndex ? value : (row[c] ?? "")))
          : row,
      ),
    );
  const updateAll = (columnIndex: number, value: string) =>
    onChange(
      data.map((row) =>
        columns.map((_, c) => (c === columnIndex ? value : (row[c] ?? ""))),
      ),
    );

  const visibleRows = sameForAll ? data.slice(0, 1) : data;

  return (
    <div className={styles.field}>
      <div className={ownStyles.header}>
        <span className={styles.label}>Rows</span>
        <CheckedField
          label="Same for all"
          checked={sameForAll}
          onChange={setSameForAll}
        />
      </div>
      <div className={styles.rows}>
        {visibleRows.map((row, rowIndex) => (
          <div className={ownStyles.instance} key={rowIndex}>
            {columns.map((column, columnIndex) => (
              <TextInput
                key={columnIndex}
                defaultValue={row[columnIndex] ?? ""}
                placeholder={column}
                onBlur={(event) =>
                  sameForAll
                    ? updateAll(columnIndex, event.target.value)
                    : updateOne(rowIndex, columnIndex, event.target.value)
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
