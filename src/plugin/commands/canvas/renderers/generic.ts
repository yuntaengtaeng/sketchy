import { sectionLayout, type DomainElement } from "../../../../shared";
import { PART } from "../../../canvas-name.ts";
import { createLabel } from "./shared";

// text를 제외한 나머지는 전부 FRAME, 타입별 전용 구조가 있으면 그걸 쓰고
// 없으면 (input/image/divider/section) 기존에 쓰던 공용 "테두리 있는 한
// 줄 + 라벨" 모양을 그대로 쓴다
export function createGenericFrame(element: DomainElement) {
  const node = figma.createFrame();
  const isSection = element.type === "section";
  const isImage = element.type === "image";
  const isDivider = element.type === "divider";
  node.resize(272, isSection ? 64 : isImage ? 160 : isDivider ? 1 : 40);
  node.layoutMode = isSection
    ? sectionLayout(element.direction || "vertical").layoutMode
    : "HORIZONTAL";
  node.primaryAxisAlignItems =
    element.type === "button" || isImage ? "CENTER" : "MIN";
  node.counterAxisAlignItems =
    element.type === "button" || element.type === "input" || isImage
      ? "CENTER"
      : "MIN";
  node.itemSpacing = isSection ? 12 : 0;
  node.paddingTop = node.paddingBottom = isSection ? 12 : 0;
  node.paddingLeft = node.paddingRight = isSection
    ? 12
    : element.type === "input" || element.type === "button"
      ? 12
      : 0;
  node.cornerRadius = isDivider ? 0 : 4;
  node.strokes = isSection
    ? [{ type: "SOLID", color: { r: 0.75, g: 0.75, b: 0.75 } }]
    : isImage || element.type === "button" || element.type === "input"
      ? [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }]
      : [];
  if (isSection) node.dashPattern = [4, 4];
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
  if (!isDivider && !isSection) {
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
  if (isSection) {
    const layout = sectionLayout(element.direction || "vertical");
    node.primaryAxisSizingMode = layout.primaryAxisSizingMode;
    node.counterAxisSizingMode = layout.counterAxisSizingMode;
  }
  if (element.type === "button" || element.type === "input")
    node.minHeight = 40;
  if (isImage) node.minHeight = 160;
  return node;
}
