import type {
  FlowDiagram as Diagram,
  FlowNode,
} from "../utils/buildFlowDiagram";
import { edgeLabelPosition } from "../utils/edgeLabelPosition";
import { elbowPath } from "../utils/elbowPath";
import styles from "./FlowCanvas.module.css";

// Flow diagram 데이터를 접근 가능한 SVG로 표시
export default function FlowDiagram({
  diagram,
  selectedId,
  onSelect,
}: {
  diagram: Diagram;
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
