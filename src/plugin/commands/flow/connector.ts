import type { Feature, Project } from "../../../shared";
import {
  elbowRoute,
  longestRouteSegment,
  routeLaneOffset,
} from "../../flow-routing";
import { drawLine, markGenerated } from "./generated";

export async function renderConnector(
  project: Project,
  link: Feature,
  links: Feature[],
  nodes: Map<string, FrameNode>,
) {
  if (
    !("destinationScreenId" in link.action) ||
    !link.action.destinationScreenId
  )
    return;
  const element = project.elements.find(
    (item) => item.id === link.trigger?.elementId,
  );
  const sourceScreen = element && nodes.get(element.screenId);
  const destination = nodes.get(link.action.destinationScreenId);
  const source = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (
    !element ||
    !sourceScreen ||
    !sourceScreen.absoluteBoundingBox ||
    !source ||
    !("absoluteBoundingBox" in source) ||
    !source.absoluteBoundingBox ||
    !destination?.absoluteBoundingBox ||
    sourceScreen.parent !== destination.parent ||
    sourceScreen.parent?.type !== "PAGE"
  )
    return;
  const from = source.absoluteBoundingBox;
  const to = destination.absoluteBoundingBox;
  const sourceBox = sourceScreen.absoluteBoundingBox;
  const centerDx = to.x + to.width / 2 - (sourceBox.x + sourceBox.width / 2);
  const centerDy = to.y + to.height / 2 - (sourceBox.y + sourceBox.height / 2);
  const horizontallySeparated =
    to.x >= sourceBox.x + sourceBox.width || to.x + to.width <= sourceBox.x;
  const verticallySeparated =
    to.y >= sourceBox.y + sourceBox.height || to.y + to.height <= sourceBox.y;
  const horizontal =
    horizontallySeparated ||
    (!verticallySeparated && Math.abs(centerDx) >= Math.abs(centerDy));
  const siblings = links.filter(
    (feature) => feature.screenId === link.screenId,
  );
  const lane = routeLaneOffset(siblings.indexOf(link), siblings.length);
  const startX = horizontal
      ? centerDx >= 0
        ? from.x + from.width
        : from.x
      : from.x + from.width / 2,
    startY = horizontal
      ? from.y + from.height / 2
      : centerDy >= 0
        ? from.y + from.height
        : from.y,
    endX = horizontal
      ? centerDx >= 0
        ? to.x
        : to.x + to.width
      : to.x + to.width / 2,
    endY = horizontal
      ? to.y + to.height / 2
      : centerDy >= 0
        ? to.y
        : to.y + to.height,
    points = elbowRoute(
      { x: startX, y: startY },
      { x: endX, y: endY },
      horizontal,
      lane,
    ),
    state = link.action.type === "overlay" || !!link.condition;
  for (let index = 1; index < points.length; index++)
    drawLine(
      sourceScreen.parent,
      points[index - 1].x,
      points[index - 1].y,
      points[index].x,
      points[index].y,
      state,
    );
  const arrowStart = points.at(-2)!;
  const arrowEnd = points.at(-1)!;
  const angle = Math.atan2(
    arrowEnd.y - arrowStart.y,
    arrowEnd.x - arrowStart.x,
  );
  for (const offset of [-Math.PI / 6, Math.PI / 6])
    drawLine(
      sourceScreen.parent,
      arrowEnd.x - 10 * Math.cos(angle + offset),
      arrowEnd.y - 10 * Math.sin(angle + offset),
      arrowEnd.x,
      arrowEnd.y,
      state,
    );
  const label = figma.createText();
  markGenerated(label);
  sourceScreen.parent.insertChild(0, label);
  label.characters = link.condition
    ? `${link.name} · ${link.condition}`
    : link.name;
  label.fontSize = 12;
  const segment = longestRouteSegment(points);
  label.x = (segment.start.x + segment.end.x) / 2 - label.width / 2;
  label.y = (segment.start.y + segment.end.y) / 2 - 22;
}
