import type {
  FlowDiagram as Diagram,
  FlowNode,
} from "../utils/buildFlowDiagram";
import type { FlowFocus } from "../utils/flowFocus";
import { edgeLabelPosition } from "../utils/edgeLabelPosition";
import { elbowPath } from "../utils/elbowPath";
import styles from "./FlowCanvas.module.css";

// Flow Node에 맞는 한 줄 Purpose 문구 구성
function purposeLabel(purpose: string) {
  const label = purpose.trim() || "Purpose missing";
  return label.length > 32 ? `${label.slice(0, 31)}…` : label;
}

// Flow diagram 데이터를 접근 가능한 SVG로 표시
export default function FlowDiagram({
  diagram,
  selectedId,
  focus,
  onSelect,
}: {
  diagram: Diagram;
  selectedId?: string;
  focus?: FlowFocus;
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
          <g
            key={edge.id}
            className={
              focus && !focus.featureIds.has(edge.featureId)
                ? styles.dimmed
                : undefined
            }
          >
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
        <g
          key={chip.id}
          className={[
            styles.chip,
            chip.kind === "unlinked" && styles.attention,
            focus && !focus.featureIds.has(chip.id) && styles.dimmed,
          ]
            .filter(Boolean)
            .join(" ")}
        >
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
            .concat(
              node.needsAttention ? [styles.attention] : [],
              focus && !focus.screenIds.has(node.id) ? [styles.dimmed] : [],
            )
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
            className={styles.nodeName}
            x={node.x + node.w / 2}
            y={node.y + node.h / 2 - 4}
            textAnchor="middle"
          >
            {node.name}
          </text>
          <text
            className={styles.nodePurpose}
            x={node.x + node.w / 2}
            y={node.y + node.h / 2 + 14}
            textAnchor="middle"
          >
            {purposeLabel(node.purpose)}
          </text>
        </g>
      ))}
    </svg>
  );
}
