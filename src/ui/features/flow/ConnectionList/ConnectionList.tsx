import Button from "../../../components/Button/Button";
import Muted from "../../../components/Muted/Muted";
import { post } from "../../../plugin";
import ConnectionTarget from "../ConnectionTarget/ConnectionTarget";
import type { ConnectionGroup, ConnectionRow } from "../utils/groupConnections";
import styles from "./ConnectionList.module.css";

// 화면별 그룹 헤더 하나와 그 아래 들여쓴 결과 행 목록
export default function ConnectionList({
  groups,
}: {
  groups: ConnectionGroup[];
}) {
  return (
    <div className={styles.groups}>
      {groups.map(({ screen, rows }) => (
        <div key={screen.id}>
          <Button
            className={styles.groupHead}
            onClick={() => post({ type: "SELECT_SCREEN", screenId: screen.id })}
          >
            {screen.name}
          </Button>
          <div className={styles.groupRows}>
            {rows.map((row) => (
              <ConnectionRowView key={row.feature.id} row={row} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Feature 하나의 트리거, 대상, 설명을 한 줄로 그리는 행
function ConnectionRowView({ row }: { row: ConnectionRow }) {
  const { feature } = row;
  const trigger = feature.condition
    ? `${feature.name} · When ${feature.condition}`
    : feature.name;
  return (
    <div className={styles.row}>
      <span className={styles.trigger}>{trigger}</span>
      <ConnectionTarget row={row} />
      {row.kind !== "describe" && feature.description && (
        <Muted className={styles.description}>{feature.description}</Muted>
      )}
    </div>
  );
}
