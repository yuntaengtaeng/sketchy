import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { screenSummary } from "../../../../core/screen-summary";
import { DEFAULT_UI_SIZE, type Project } from "../../../../shared";
import { useFadeClose } from "../../../hooks/useFadeClose";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import { post, resizeUi } from "../../../plugin";
import { buildFlowDiagram, type FlowNode } from "../utils/buildFlowDiagram";
import {
  centeredTransform,
  fullscreenSize,
  popoverPosition,
  zoomedTransform,
} from "../utils/flowViewport";
import FlowDiagram from "./FlowDiagram";
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
  return fullscreenSize({
    available: {
      width: window.screen.availWidth,
      height: window.screen.availHeight,
    },
    margin: FULLSCREEN_MARGIN,
    min: FULLSCREEN_MIN,
    max: FULLSCREEN_MAX,
  });
}

// 클릭 지점 근처에 뜨도록, 화면 밖으로 나가지 않게 팝오버 좌표 보정
function clampPopover(x: number, y: number) {
  return popoverPosition({
    anchor: { x, y },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    popoverWidth: POPOVER_W,
    margin: POPOVER_MARGIN,
    bottomLimit: 96,
  });
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
    transform.current = centeredTransform({
      viewport: { width: overlay.clientWidth, height: overlay.clientHeight },
      content: { width: CONTENT_W, height: CONTENT_H },
    });
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
    transform.current = zoomedTransform({
      current: transform.current,
      nextScale,
      pivot: { x: pivotX, y: pivotY },
      minScale: MIN_SCALE,
      maxScale: MAX_SCALE,
    });
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
        <FlowDiagram
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
