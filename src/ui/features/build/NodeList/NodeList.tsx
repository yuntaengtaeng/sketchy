import { Fragment, useEffect, useRef, useState, type DragEvent } from "react";
import {
  isFixedScreenEdgeElement,
  type Element as SketchyElement,
} from "../../../../shared";
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
  const [draggingId, setDraggingId] = useState<string>();
  const [dropAt, setDropAt] = useState<number>();
  const insertedRef = useRef<HTMLDivElement>(null);
  const movableNodes = nodes.filter((item) => !isFixedScreenEdgeElement(item));

  // 새 요소 위치로 스크롤 이동
  useEffect(() => {
    if (insertedElementId)
      insertedRef.current?.scrollIntoView({ block: "nearest" });
  }, [insertedElementId]);

  // 포인터 위치에 해당하는 이동 가능 요소의 삽입 지점 설정
  const dragOverRow = (event: DragEvent<HTMLDivElement>, index: number) => {
    if (!draggingId) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    const next = before ? index : index + 1;
    if (next !== dropAt) setDropAt(next);
  };

  // 이동 가능 요소 목록을 기준으로 순서 변경 요청 전송
  const drop = () => {
    const fromIndex = movableNodes.findIndex((item) => item.id === draggingId);
    if (draggingId && dropAt !== undefined && fromIndex !== -1) {
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
        onDragOver={(event) => {
          if (draggingId && dropAt !== undefined) event.preventDefault();
        }}
        onDrop={(event) => {
          if (!draggingId || dropAt === undefined) return;
          event.preventDefault();
          drop();
        }}
      >
        {nodes.map((item) => {
          const fixed = isFixedScreenEdgeElement(item);
          const movableIndex = movableNodes.findIndex(
            (candidate) => candidate.id === item.id,
          );
          return (
            <Fragment key={item.id}>
              {draggingId && movableIndex >= 0 && dropAt === movableIndex && (
                <div className={styles.dropLine} aria-hidden="true" />
              )}
              <div
                className={styles.node}
                data-dragging={draggingId === item.id || undefined}
                data-fixed={fixed || undefined}
                data-inserted={insertedElementId === item.id || undefined}
                ref={insertedElementId === item.id ? insertedRef : undefined}
                onDragOver={(event) => {
                  if (fixed) {
                    event.stopPropagation();
                    setDropAt(undefined);
                    return;
                  }
                  dragOverRow(event, movableIndex);
                }}
                onDrop={(event) => {
                  event.stopPropagation();
                  if (fixed || dropAt === undefined) return;
                  event.preventDefault();
                  drop();
                }}
              >
                {fixed ? (
                  <span className={styles.fixedPosition}>Fixed</span>
                ) : (
                  <span
                    className={styles.dragHandle}
                    role="button"
                    tabIndex={0}
                    aria-label={`Reorder ${item.name}, drag or use arrow keys`}
                    draggable
                    onDragStart={(event) => {
                      // 일부 엔진의 drop 인식을 위한 전송 데이터
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                      setDraggingId(item.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(undefined);
                      setDropAt(undefined);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowUp" && movableIndex > 0) {
                        event.preventDefault();
                        post({
                          type: "MOVE_ELEMENT",
                          elementId: item.id,
                          direction: "up",
                        });
                      } else if (
                        event.key === "ArrowDown" &&
                        movableIndex < movableNodes.length - 1
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
                    ≡
                  </span>
                )}
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
              {draggingId &&
                movableIndex === movableNodes.length - 1 &&
                dropAt === movableNodes.length && (
                  <div className={styles.dropLine} aria-hidden="true" />
                )}
            </Fragment>
          );
        })}
        {!nodes.length && <Muted>No elements yet</Muted>}
      </div>
    </Section>
  );
}
