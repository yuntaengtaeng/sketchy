import { useState } from "react";
import CheckedField from "./CheckedField";
import styles from "./StringListField.module.css";
import ownStyles from "./InstanceFieldsField.module.css";

// Table은 Card/List Item과 달리 진짜 행렬(행×가변 개수 열)이라 같은 컨트롤로
// 묶지 않고, columns 길이만큼 셀을 한 행에 나열하는 전용 그리드를 쓴다.
// "Same for all"이 켜져 있으면(기본값) 행 하나만 보여주고 그 값을 count만큼
// 그대로 복제해 저장, 끄면 행마다 각각 입력하는 모드로 돌아간다
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
              <input
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
