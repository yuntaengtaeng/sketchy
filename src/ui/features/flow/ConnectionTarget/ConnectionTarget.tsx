import Button from "../../../components/Button/Button";
import Chip from "../../../components/Chip/Chip";
import Muted from "../../../components/Muted/Muted";
import { post } from "../../../plugin";
import type { ConnectionRow } from "../utils/groupConnections";
import styles from "./ConnectionTarget.module.css";

// row의 kind에 따라 배지와 목적지 표시를 다르게 그리는 대상 영역
export default function ConnectionTarget({ row }: { row: ConnectionRow }) {
  switch (row.kind) {
    case "navigate":
      return <Destination destination={row.destination} />;
    case "popup":
      return (
        <>
          <Chip>Popup</Chip>
          <Destination destination={row.destination} />
        </>
      );
    case "toast":
      return (
        <>
          <Chip>Toast</Chip>
          <Muted className={styles.text}>{row.destinationLabel}</Muted>
        </>
      );
    case "close-overlay":
      return <Muted className={styles.text}>Close popup</Muted>;
    case "describe":
      return (
        <Muted className={styles.text}>
          {row.feature.description || "Outcome not described"}
        </Muted>
      );
    default: {
      const exhaustive: never = row;
      throw new Error("Unhandled row kind: " + JSON.stringify(exhaustive));
    }
  }
}

// 목적지 화면이 있으면 이동 버튼, 없으면 미연결 안내 문구
function Destination({
  destination,
}: {
  destination?: { id: string; name: string };
}) {
  return destination ? (
    <Button
      onClick={() => post({ type: "SELECT_SCREEN", screenId: destination.id })}
    >
      {destination.name}
    </Button>
  ) : (
    <Muted className={styles.text}>Choose destination not linked</Muted>
  );
}
