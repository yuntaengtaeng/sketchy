import { Fragment, useEffect, useRef, useState, type DragEvent } from "react";
import type { Element as SketchyElement } from "../../../../shared";
import Button from "../../../components/Button/Button";
import Muted from "../../../components/Muted/Muted";
import Section from "../../../components/Section/Section";
import Title from "../../../components/Title/Title";
import { post } from "../../../plugin";
import styles from "./NodeList.module.css";

export default function NodeList({
  title,
  nodes,
  selectedElementId,
  insertedElementId,
}: {
  title: string;
  nodes: SketchyElement[];
  selectedElementId?: string;
  insertedElementId?: string;
}) {
  // 마우스는 행을 드래그해서 옮기고, 키보드는 손잡이에 포커스한 뒤
  // 화살표 키로 한 칸씩 옮긴다 — 화살표 버튼을 항상 그려두지 않아도
  // 키보드 전용 사용자에게 순서 변경 방법이 남아있다
  const [draggingId, setDraggingId] = useState<string>();
  // 드롭하면 nodes[dropAt] "앞"에 꽂힌다(끝이면 dropAt === nodes.length)
  const [dropAt, setDropAt] = useState<number>();
  const insertedRef = useRef<HTMLDivElement>(null);

  // 선택은 그대로 화면(부모)에 두어 "블록을 쭉 쌓는" 흐름을 끊지 않되,
  // 방금 추가된 행으로 스크롤+하이라이트해 "바로 수정" 흐름도 눈으로 바로 찾게 한다
  useEffect(() => {
    if (insertedElementId)
      insertedRef.current?.scrollIntoView({ block: "nearest" });
  }, [insertedElementId]);

  const dragOverRow = (event: DragEvent<HTMLDivElement>, index: number) => {
    if (!draggingId) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    const next = before ? index : index + 1;
    if (next !== dropAt) setDropAt(next);
  };

  const drop = () => {
    const fromIndex = nodes.findIndex((item) => item.id === draggingId);
    if (draggingId && dropAt !== undefined && fromIndex !== -1) {
      // reorderElement는 먼저 빼고 나서 꽂으므로, 원래 index보다 뒤로
      // 옮길 땐 하나 당겨줘야 드롭한 자리 그대로 들어간다
      const toIndex = dropAt > fromIndex ? dropAt - 1 : dropAt;
      post({ type: "REORDER_ELEMENT", elementId: draggingId, toIndex });
    }
    setDraggingId(undefined);
    setDropAt(undefined);
  };

  return (
    <Section>
      <Title>{title}</Title>
      <div
        className={styles.nodes}
        // 행 사이 6px gap이나 삽입선(dropLine) 위에서 마우스를 놓으면 그
        // 지점엔 onDragOver가 없어 브라우저가 "유효하지 않은 위치"로 보고
        // drop 없이 dragend로 끝내버린다, 컨테이너 전체를 유효한 드롭
        // 영역으로 넓혀서 어디서 놓든 마지막 dropAt으로 반영되게 한다
        onDragOver={(event) => draggingId && event.preventDefault()}
        onDrop={(event) => {
          if (!draggingId) return;
          event.preventDefault();
          drop();
        }}
      >
        {nodes.map((item, index) => (
          <Fragment key={item.id}>
            {draggingId && dropAt === index && (
              <div className={styles.dropLine} aria-hidden="true" />
            )}
            <div
              className={styles.node}
              data-dragging={draggingId === item.id || undefined}
              data-inserted={insertedElementId === item.id || undefined}
              ref={insertedElementId === item.id ? insertedRef : undefined}
              onDragOver={(event) => dragOverRow(event, index)}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                drop();
              }}
            >
              {/* 행 전체를 draggable로 두면 대부분을 차지하는 nodeSelect
              버튼 위에서 드래그를 시작할 때 일부 웹뷰 엔진이 조상의
              draggable을 인식 못 해 간헐적으로 실패한다(dragstart 자체가
              안 붙음) — 버튼과 안 겹치는 전용 손잡이로 좁히는 대신 훨씬
              크게 만들어 잡기 쉽게 한다 */}
              <span
                className={styles.dragHandle}
                role="button"
                tabIndex={0}
                aria-label={`Reorder ${item.name}, drag or use arrow keys`}
                draggable
                onDragStart={(event) => {
                  // dataTransfer에 뭔가 채워야 일부 엔진이 drop을 인식한다
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                  setDraggingId(item.id);
                }}
                onDragEnd={() => {
                  setDraggingId(undefined);
                  setDropAt(undefined);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp" && index > 0) {
                    event.preventDefault();
                    post({
                      type: "MOVE_ELEMENT",
                      elementId: item.id,
                      direction: "up",
                    });
                  } else if (
                    event.key === "ArrowDown" &&
                    index < nodes.length - 1
                  ) {
                    event.preventDefault();
                    post({
                      type: "MOVE_ELEMENT",
                      elementId: item.id,
                      direction: "down",
                    });
                  }
                }}
              >
                ⠿
              </span>
              <Button
                className={styles.nodeSelect}
                aria-pressed={selectedElementId === item.id}
                onClick={() =>
                  post({ type: "SELECT_ELEMENT", elementId: item.id })
                }
              >
                <span>{item.name}</span>
                <small>{item.type}</small>
              </Button>
              {/* popup 자체는 지울 수 없다(ElementDetails의 Delete와 동일
              규칙), 확인창도 그쪽과 맞춰 없앤다 */}
              {item.role !== "popup" && (
                <Button
                  variant="plain"
                  className={styles.nodeDelete}
                  aria-label={`Delete ${item.name}`}
                  onClick={() =>
                    post({ type: "DELETE_ELEMENT", elementId: item.id })
                  }
                >
                  ×
                </Button>
              )}
            </div>
          </Fragment>
        ))}
        {draggingId && dropAt === nodes.length && (
          <div className={styles.dropLine} aria-hidden="true" />
        )}
        {!nodes.length && <Muted>No elements yet.</Muted>}
      </div>
    </Section>
  );
}
