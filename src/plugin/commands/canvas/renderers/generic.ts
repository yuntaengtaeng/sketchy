import {
  defaultSectionDirection,
  isContainerElement,
  sectionLayout,
  type DomainElement,
} from "../../../../shared";
import { PART } from "../../../canvas-name.ts";
import { createLabel } from "./shared";

// text 외 전용 구조가 없는 타입이 쓰는 공용 프레임(테두리 한 줄 또는 컨테이너)
export function createGenericFrame(element: DomainElement) {
  const node = figma.createFrame();
  const isContainer = isContainerElement(element);
  const isImage = element.type === "image";
  const isDivider = element.type === "divider";
  const direction = isContainer
    ? element.direction || defaultSectionDirection(element.type)
    : undefined;
  node.resize(272, isContainer ? 64 : isImage ? 160 : isDivider ? 1 : 40);
  node.layoutMode = direction
    ? sectionLayout(direction).layoutMode
    : "HORIZONTAL";
  node.primaryAxisAlignItems =
    element.type === "button" || isImage ? "CENTER" : "MIN";
  node.counterAxisAlignItems =
    element.type === "button" ||
    element.type === "input" ||
    isImage ||
    direction === "horizontal"
      ? "CENTER"
      : "MIN";
  node.itemSpacing = isContainer ? 12 : 0;
  node.paddingTop = node.paddingBottom = isContainer ? 12 : 0;
  node.paddingLeft = node.paddingRight = isContainer
    ? 12
    : element.type === "input" || element.type === "button"
      ? 12
      : 0;
  node.cornerRadius = isDivider ? 0 : 4;
  node.strokes = isContainer
    ? [{ type: "SOLID", color: { r: 0.75, g: 0.75, b: 0.75 } }]
    : isImage || element.type === "button" || element.type === "input"
      ? [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }]
      : [];
  if (isContainer) node.dashPattern = [4, 4];
  const filledButton =
    element.type === "button" &&
    (element.buttonVariant || "filled") === "filled";
  node.fills = [
    {
      type: "SOLID",
      color:
        isDivider || filledButton
          ? { r: 0.15, g: 0.15, b: 0.15 }
          : isImage
            ? { r: 0.92, g: 0.92, b: 0.9 }
            : { r: 1, g: 1, b: 1 },
    },
  ];
  // 컨테이너는 안에 실제 콘텐츠가 쌓이므로 라벨 텍스트 없이 레이어 이름만 사용
  if (!isDivider && !isContainer) {
    // Input은 이름이 아니라 Placeholder를 보여준다, 실제 input의 placeholder
    // 텍스트처럼 옅은 회색으로
    const text =
      element.type === "input"
        ? element.placeholder || "Type here..."
        : element.name;
    const label = createLabel(
      text,
      14,
      filledButton ? { r: 1, g: 1, b: 1 } : { r: 0.35, g: 0.35, b: 0.35 },
    );
    label.setPluginData(PART, "label");
    node.appendChild(label);
  }
  if (direction) {
    const layout = sectionLayout(direction);
    node.primaryAxisSizingMode = layout.primaryAxisSizingMode;
    node.counterAxisSizingMode = layout.counterAxisSizingMode;
  }
  if (element.type === "button" || element.type === "input")
    node.minHeight = 40;
  if (isImage) node.minHeight = 160;
  return node;
}
