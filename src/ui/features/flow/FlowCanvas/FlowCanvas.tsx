import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { DEFAULT_UI_SIZE, type Project } from "../../../../shared";
import { useFadeClose } from "../../../hooks/useFadeClose";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import { post, resizeUi } from "../../../plugin";
import {
  buildFlowDiagram,
  type FlowDiagram,
  type FlowEdge,
  type FlowNode,
} from "../utils/buildFlowDiagram";
import { elbowPath } from "../utils/elbowPath";
import { screenSummary } from "../utils/screenSummary";
import styles from "./FlowCanvas.module.css";

const CONTENT_W = 1100;
const CONTENT_H = 820;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const ZOOM_STEP = 0.2;
const POPOVER_W = 220;
const POPOVER_MARGIN = 12;
const CLOSE_TRANSITION_MS = 180;
const FULLSCREEN_MARGIN = 80;
const FULLSCREEN_MIN = { width: 600, height: 500 };
const FULLSCREEN_MAX = { width: 1800, height: 1200 };

// 이 사용자의 모니터 크기에 맞춘 전체화면 패널 크기, 너무 작거나 크지 않게 clamp
function fullscreenUiSize() {
  return {
    width: Math.min(
      FULLSCREEN_MAX.width,
      Math.max(
        FULLSCREEN_MIN.width,
        window.screen.availWidth - FULLSCREEN_MARGIN,
      ),
    ),
    height: Math.min(
      FULLSCREEN_MAX.height,
      Math.max(
        FULLSCREEN_MIN.height,
        window.screen.availHeight - FULLSCREEN_MARGIN,
      ),
    ),
  };
}

// 클릭 지점 근처에 뜨도록, 화면 밖으로 나가지 않게 팝오버 좌표 보정
function clampPopover(x: number, y: number) {
  return {
    x: Math.min(
      Math.max(x + POPOVER_MARGIN, POPOVER_MARGIN),
      window.innerWidth - POPOVER_W - POPOVER_MARGIN,
    ),
    y: Math.min(
      Math.max(y + POPOVER_MARGIN, POPOVER_MARGIN),
      window.innerHeight - 96,
    ),
  };
}

// Project의 화면 흐름을 드래그와 줌으로 탐색하는 전체화면 캔버스
export default function FlowCanvas({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const diagram = useMemo(() => buildFlowDiagram(project), [project]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const transform = useRef({ tx: 0, ty: 0, scale: 1 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [selected, setSelected] = useState<FlowNode>();
  const [popover, setPopover] = useState<{ x: number; y: number }>();
  // 실제로 커진 뒤에만 보여줘서, 아직 작은 패널 안에서 뜨는 순간을 감춘다
  const [visible, setVisible] = useState(false);
  const closeStarted = useRef(false);

  useOutsideClick(popoverRef, () => setPopover(undefined));

  const { closing, close: fadeOutThenClose } = useFadeClose(
    onClose,
    CLOSE_TRANSITION_MS,
  );

  // 패널이 원래 크기로 다시 줄어드는 것까지 다 가린 뒤에야 캔버스를 페이드아웃한다
  const closeAndFocus = () => {
    if (closeStarted.current) return;
    closeStarted.current = true;
    if (selected) post({ type: "SELECT_SCREEN", screenId: selected.id });
    void resizeUi(DEFAULT_UI_SIZE.width, DEFAULT_UI_SIZE.height).then(
      fadeOutThenClose,
    );
  };

  const selectNode = (node: FlowNode, anchorX: number, anchorY: number) => {
    setSelected(node);
    setPopover(clampPopover(anchorX, anchorY));
  };

  const applyTransform = () => {
    const { tx, ty, scale } = transform.current;
    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }
    setZoomPercent(Math.round(scale * 100));
  };

  const centerContent = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    transform.current = {
      tx: (overlay.clientWidth - CONTENT_W) / 2,
      ty: (overlay.clientHeight - CONTENT_H) / 2,
      scale: 1,
    };
    applyTransform();
  };

  useEffect(() => {
    let cancelled = false;
    const { width, height } = fullscreenUiSize();
    void resizeUi(width, height).then(() => {
      if (cancelled) return;
      centerContent();
      setVisible(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // selected가 바뀔 때마다 다시 등록해야 Esc가 최신 선택 화면을 참조한다
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAndFocus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // pivot 아래의 캔버스 좌표가 확대/축소 후에도 같은 화면 위치에 남도록 tx/ty 보정
  const zoomTo = (nextScale: number, pivotX: number, pivotY: number) => {
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    const { tx, ty, scale: prevScale } = transform.current;
    const cx = (pivotX - tx) / prevScale;
    const cy = (pivotY - ty) / prevScale;
    transform.current = {
      scale,
      tx: pivotX - cx * scale,
      ty: pivotY - cy * scale,
    };
    applyTransform();
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-no-drag]") || target.closest(`.${styles.node}`)) {
      return;
    }
    dragStart.current = {
      x: event.clientX - transform.current.tx,
      y: event.clientY - transform.current.ty,
    };
    overlayRef.current?.setPointerCapture(event.pointerId);
    overlayRef.current?.classList.add(styles.dragging);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    transform.current = {
      ...transform.current,
      tx: event.clientX - dragStart.current.x,
      ty: event.clientY - dragStart.current.y,
    };
    applyTransform();
  };
  const endDrag = () => {
    dragStart.current = null;
    overlayRef.current?.classList.remove(styles.dragging);
  };

  const zoomAtCenter = (delta: number) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    zoomTo(
      transform.current.scale + delta,
      overlay.clientWidth / 2,
      overlay.clientHeight / 2,
    );
  };

  return (
    <div
      ref={overlayRef}
      className={[
        styles.overlay,
        visible && styles.visible,
        closing && styles.closing,
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={(event) => {
        event.preventDefault();
        zoomTo(
          transform.current.scale * (1 - event.deltaY * 0.0015),
          event.clientX,
          event.clientY,
        );
      }}
    >
      <div className={styles.topbar} data-no-drag>
        <div>
          <b>Project flow</b>
          <div className={styles.hint}>
            Drag to move, scroll to zoom, Esc to close
          </div>
        </div>
        <button
          className={styles.close}
          type="button"
          onClick={closeAndFocus}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className={styles.zoom} data-no-drag>
        <button type="button" onClick={() => zoomAtCenter(-ZOOM_STEP)}>
          −
        </button>
        <span className={styles.zoomLevel}>{zoomPercent}%</span>
        <button type="button" onClick={() => zoomAtCenter(ZOOM_STEP)}>
          +
        </button>
        <button type="button" onClick={centerContent} aria-label="Reset view">
          ⟲
        </button>
      </div>

      <div ref={contentRef} className={styles.content}>
        <FlowSvg
          diagram={diagram}
          selectedId={selected?.id}
          onSelect={selectNode}
        />
      </div>

      {selected && popover && (
        <ScreenPopover
          ref={popoverRef}
          node={selected}
          project={project}
          x={popover.x}
          y={popover.y}
          onDismiss={() => setPopover(undefined)}
        />
      )}
    </div>
  );
}

// 선택된 화면 이름, 목적, 요소/동작/들어오는 연결 수를 보여주는 팝오버
const ScreenPopover = forwardRef<
  HTMLDivElement,
  {
    node: FlowNode;
    project: Project;
    x: number;
    y: number;
    onDismiss: () => void;
  }
>(({ node, project, x, y, onDismiss }, ref) => {
  const { elementCount, behaviorCount, incomingCount } = screenSummary(
    project,
    node.id,
  );
  return (
    <div
      ref={ref}
      className={styles.popover}
      data-no-drag
      style={{ left: x, top: y }}
    >
      <button
        className={styles.popoverClose}
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
      <div className={styles.name}>{node.name}</div>
      {node.purpose && <div className={styles.purpose}>{node.purpose}</div>}
      <div className={styles.stats}>
        <span>
          {elementCount === 1 ? "1 element" : `${elementCount} elements`}
        </span>
        <span>
          {behaviorCount === 1 ? "1 behavior" : `${behaviorCount} behaviors`}
        </span>
        <span>{incomingCount} incoming</span>
      </div>
    </div>
  );
});
ScreenPopover.displayName = "ScreenPopover";

// diagram 데이터를 노드, 칩, 엣지 SVG 요소로 그리는 렌더러
function FlowSvg({
  diagram,
  selectedId,
  onSelect,
}: {
  diagram: FlowDiagram;
  selectedId?: string;
  onSelect: (node: FlowNode, anchorX: number, anchorY: number) => void;
}) {
  return (
    <svg
      viewBox={`0 0 ${diagram.width} ${diagram.height}`}
      role="img"
      aria-label="Screen flow diagram"
    >
      <defs>
        <marker
          id="flow-arrow"
          viewBox="0 0 8 8"
          refX={7}
          refY={4}
          markerWidth={7}
          markerHeight={7}
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 z" fill="rgba(255,255,255,0.55)" />
        </marker>
      </defs>

      {diagram.edges.map((edge) => {
        const label = edgeLabelPosition(edge);
        return (
          <g key={edge.id}>
            <path
              className={[styles.edge, edge.dashed && styles.dashed]
                .filter(Boolean)
                .join(" ")}
              markerEnd="url(#flow-arrow)"
              d={elbowPath(edge.points, edge.points.length > 2 ? 10 : 0)}
            />
            <text
              className={styles.edgeLabel}
              x={label.x}
              y={label.y}
              textAnchor={label.anchor}
            >
              {edge.label}
            </text>
          </g>
        );
      })}

      {diagram.chips.map((chip) => (
        <g key={chip.id} className={styles.chip}>
          <rect
            x={chip.x}
            y={chip.y}
            width={chip.w}
            height={chip.h}
            rx={chip.h / 2}
          />
          <text
            x={chip.x + chip.w / 2}
            y={chip.y + chip.h / 2 + 4}
            textAnchor="middle"
          >
            {chip.name}
          </text>
        </g>
      ))}

      {diagram.nodes.map((node) => (
        <g
          key={node.id}
          className={[styles.node, node.id === selectedId && styles.selected]
            .filter(Boolean)
            .join(" ")}
          tabIndex={0}
          onClick={(event) => onSelect(node, event.clientX, event.clientY)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              onSelect(node, rect.left + rect.width / 2, rect.top);
            }
          }}
        >
          <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={4} />
          <text
            x={node.x + node.w / 2}
            y={node.y + node.h / 2 + 4}
            textAnchor="middle"
          >
            {node.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

// 엣지 모양(직선/분기/우회)에 따라 라벨을 겹치지 않는 자리에 가로로 배치
function edgeLabelPosition(edge: FlowEdge): {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
} {
  const points = edge.points;
  if (points.length === 2) {
    return {
      x: points[0].x + 8,
      y: (points[0].y + points[1].y) / 2,
      anchor: "start",
    };
  }
  if (edge.dashed) {
    const [a, b] = points.slice(-2);
    return { x: (a.x + b.x) / 2, y: b.y - 8, anchor: "middle" };
  }
  const laneX = Math.min(...points.map((point) => point.x));
  const laneYs = points
    .filter((point) => point.x === laneX)
    .map((point) => point.y);
  const midY = (Math.min(...laneYs) + Math.max(...laneYs)) / 2;
  return { x: laneX - 6, y: midY, anchor: "end" };
}
