import type { Feature, Project } from "../../../../shared";
import { toastLabel } from "./groupConnections.ts";

const NODE_X = 40;
const NODE_W = 160;
const NODE_H = 48;
const ROW_GAP = 120;
const MARGIN_TOP = 10;
const CHIP_H = 44;
const CHIP_GAP_Y = 10;
const CHIP_PAD_X = 22;
const CHIP_MIN_W = 80;
const GAP_ALPHA = 36;
const GAP_MIN = 48;
const STUB = 16;
const LANE_X = 14;
const LOOP_CLEARANCE = 28;
const LANE_STEP = 10;

export type FlowNode = {
  id: string;
  name: string;
  purpose: string;
  x: number;
  y: number;
  w: number;
  h: number;
  needsAttention: boolean;
};
export type FlowChip = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "popup" | "toast" | "unlinked";
};
export type FlowEdge = {
  id: string;
  featureId: string;
  points: { x: number; y: number }[];
  label: string;
  dashed: boolean;
};
export type FlowDiagram = {
  nodes: FlowNode[];
  chips: FlowChip[];
  edges: FlowEdge[];
  width: number;
  height: number;
};

export type TextMeasurer = (text: string, font: string) => number;

let cachedCtx: CanvasRenderingContext2D | null = null;
// 실제 렌더링 폭 측정, 테스트에서는 결정적인 measure로 대체
const defaultMeasure: TextMeasurer = (text, font) => {
  cachedCtx ??= document.createElement("canvas").getContext("2d");
  cachedCtx!.font = font;
  return cachedCtx!.measureText(text).width;
};

type Branch = {
  feature: Feature;
  kind: FlowChip["kind"];
  text: string;
  popupScreenId?: string;
};

type LoopOptions = {
  id: string;
  featureId: string;
  label: string;
  exit: { x: number; y: number };
  exitFromLeft: boolean;
  corridorY: number;
  targetScreenId: string;
};

// Project 데이터를 캔버스 좌표의 노드, 칩, 엣지로 배치하는 순수 레이아웃 계산
export function buildFlowDiagram(
  project: Project,
  measure: TextMeasurer = defaultMeasure,
): FlowDiagram {
  const mainScreens = project.screens.filter((screen) => !screen.kind);
  const rowIndex = new Map(mainScreens.map((screen, i) => [screen.id, i]));
  const incomingScreenIds = new Set(
    project.features.flatMap((feature) => {
      if (!("destinationScreenId" in feature.action)) return [];
      return feature.action.destinationScreenId
        ? [feature.action.destinationScreenId]
        : [];
    }),
  );
  // 화면 ID에 대응하는 행의 세로 좌표 계산
  const rowY = (id: string) => MARGIN_TOP + (rowIndex.get(id) ?? 0) * ROW_GAP;

  const nodes: FlowNode[] = mainScreens.map((screen, index) => ({
    id: screen.id,
    name: screen.name,
    purpose: screen.purpose,
    x: NODE_X,
    y: rowY(screen.id),
    w: NODE_W,
    h: NODE_H,
    needsAttention: index > 0 && !incomingScreenIds.has(screen.id),
  }));

  const chips: FlowChip[] = [];
  const edges: FlowEdge[] = [];
  let loopCount = 0;
  let maxX = NODE_X + NODE_W;

  // 인접하지 않은 navigate와 팝업 복귀용 화면 간 우회 경로 추가
  function addLoop({
    id,
    featureId,
    label,
    exit,
    exitFromLeft,
    corridorY,
    targetScreenId,
  }: LoopOptions) {
    const laneX = LANE_X - loopCount * LANE_STEP;
    loopCount++;
    const entry = { x: NODE_X - 2, y: rowY(targetScreenId) + NODE_H / 2 };
    const points = exitFromLeft
      ? [exit, { x: laneX, y: exit.y }, { x: laneX, y: entry.y }, entry]
      : [
          exit,
          { x: exit.x, y: corridorY },
          { x: laneX, y: corridorY },
          { x: laneX, y: entry.y },
          entry,
        ];
    edges.push({ id, featureId, points, label, dashed: false });
  }

  for (const screen of mainScreens) {
    const branchGroup: Branch[] = [];

    for (const feature of project.features.filter(
      (item) => item.screenId === screen.id,
    )) {
      const action = feature.action;
      if (action.type === "navigate") {
        const destinationId = action.destinationScreenId;
        const targetIndex = destinationId
          ? rowIndex.get(destinationId)
          : undefined;
        if (destinationId === undefined || targetIndex === undefined) {
          branchGroup.push({
            feature,
            kind: "unlinked",
            text: "Choose destination",
          });
          continue;
        }
        const sourceIndex = rowIndex.get(screen.id)!;
        if (targetIndex === sourceIndex + 1) {
          const x = NODE_X + NODE_W / 2;
          edges.push({
            id: feature.id,
            featureId: feature.id,
            points: [
              { x, y: rowY(screen.id) + NODE_H },
              { x, y: rowY(destinationId) },
            ],
            label: feature.name,
            dashed: false,
          });
        } else {
          const y = rowY(screen.id) + NODE_H / 2;
          addLoop({
            id: feature.id,
            featureId: feature.id,
            label: feature.name,
            exit: { x: NODE_X, y },
            exitFromLeft: true,
            corridorY: y,
            targetScreenId: destinationId,
          });
        }
        continue;
      }
      if (action.type === "overlay") {
        const destination = action.destinationScreenId
          ? project.screens.find(
              (item) => item.id === action.destinationScreenId,
            )
          : undefined;
        branchGroup.push({
          feature,
          kind: destination ? "popup" : "unlinked",
          text: destination ? destination.name : "Choose destination",
          popupScreenId: destination?.id,
        });
        continue;
      }
      if (action.type === "toast") {
        branchGroup.push({
          feature,
          kind: "toast",
          text: toastLabel(project, action.destinationScreenId),
        });
        continue;
      }
      // close-overlay와 describe는 시각적 목적지가 없어 목록(ConnectionList)에만 표시
    }

    if (!branchGroup.length) continue;
    const gap = Math.max(
      GAP_MIN,
      ...branchGroup.map(
        (branch) => measure(branch.feature.name, "400 10px Inter") + GAP_ALPHA,
      ),
    );
    const chipX = NODE_X + NODE_W + gap;

    branchGroup.forEach((branch, index) => {
      const w = Math.max(
        CHIP_MIN_W,
        measure(branch.text, "500 10px Inter") + CHIP_PAD_X,
      );
      const y = rowY(screen.id) + index * (CHIP_H + CHIP_GAP_Y);
      chips.push({
        id: branch.feature.id,
        name: branch.text,
        x: chipX,
        y,
        w,
        h: CHIP_H,
        kind: branch.kind,
      });
      maxX = Math.max(maxX, chipX + w);

      const nodeY = rowY(screen.id) + NODE_H / 2;
      const chipY = y + CHIP_H / 2;
      const turnX = NODE_X + NODE_W + STUB;
      edges.push({
        id: `${branch.feature.id}-connector`,
        featureId: branch.feature.id,
        points: [
          { x: NODE_X + NODE_W, y: nodeY },
          { x: turnX, y: nodeY },
          { x: turnX, y: chipY },
          { x: chipX, y: chipY },
        ],
        label: branch.feature.name,
        dashed: true,
      });

      if (!branch.popupScreenId) return;
      for (const inner of project.features.filter(
        (item) => item.screenId === branch.popupScreenId,
      )) {
        if (inner.action.type !== "navigate") continue;
        const destinationId = inner.action.destinationScreenId;
        if (!destinationId || !rowIndex.has(destinationId)) continue;
        const corridorY = rowY(screen.id) - LOOP_CLEARANCE;
        addLoop({
          id: `${inner.id}-return`,
          featureId: inner.id,
          label: inner.name,
          exit: { x: chipX + w / 2, y },
          exitFromLeft: false,
          corridorY,
          targetScreenId: destinationId,
        });
      }
    });
  }

  const bottoms = [
    ...nodes.map((node) => node.y + node.h),
    ...chips.map((chip) => chip.y + chip.h),
    MARGIN_TOP + NODE_H,
  ];
  return {
    nodes,
    chips,
    edges,
    width: maxX + 24,
    height: Math.max(...bottoms) + 20,
  };
}
