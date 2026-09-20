import {
  BLOCK_DEFINITIONS,
  CONTAINER_BLOCK_TYPES,
  canNestSection,
  defaultSectionDirection,
  elementSiblings,
  elementTreeIds,
  isContainerElement,
  nextElementName,
  type BlockType,
} from "../../../shared";
import type { DomainElement, Project } from "../../../shared";
import { defaultAutoChildren } from "../../../core/default-auto-children.ts";
import {
  normalizeElementOrder,
  readProject,
  saveProject,
} from "../../storage/project";
import { focusNode, id, loadFont } from "./utils";
import { createElementNode, renderElementName } from "./element-render";
import {
  applyOrder,
  pinEdgeToScreen,
  pinHeaderAndFooter,
  syncScreenEdgePadding,
} from "./headerFooterLayout.ts";

export async function insertBlock(
  screenId: string,
  block: BlockType,
  parentElementId?: string,
  buttonVariant: "filled" | "outline" = "filled",
) {
  await loadFont();
  const project = readProject();
  const screen = project.screens.find((item) => item.id === screenId);
  const frame = screen && (await figma.getNodeByIdAsync(screen.nodeId));
  if (!frame || frame.type !== "FRAME")
    throw new Error("Select a Sketchy screen, then try again.");
  const parentElement = project.elements.find(
    (item) => item.id === parentElementId && item.screenId === screenId,
  );
  const parentNode = parentElement
    ? await figma.getNodeByIdAsync(parentElement.nodeId)
    : frame;
  if (
    parentElement &&
    (!isContainerElement(parentElement) || parentNode?.type !== "FRAME")
  )
    throw new Error("Select a container, then add the block again.");
  if (
    CONTAINER_BLOCK_TYPES.includes(block) &&
    parentElement &&
    !canNestSection(project.elements, parentElement)
  )
    throw new Error(
      "Choose the screen or a top-level container; containers can only be nested one level.",
    );
  const elementId = id();
  const base = {
    id: elementId,
    screenId,
    name: nextElementName(
      project.elements,
      screenId,
      BLOCK_DEFINITIONS[block].label,
    ),
    parentElementId: parentElement?.id,
  };
  // block별로 필요한 필드가 다른 discriminated union이라, 값을 한 번에 못 채우고
  // block 값을 분기해 그 variant가 실제로 갖는 필드만 채운다
  const element: DomainElement = ((): DomainElement => {
    switch (block) {
      case "button":
        return { ...base, type: block, buttonVariant };
      case "section":
      case "header":
      case "footer":
        return {
          ...base,
          type: block,
          direction: defaultSectionDirection(block),
        };
      case "tabs":
        return {
          ...base,
          type: block,
          tabItems: ["Tab 1", "Tab 2"],
          selectedTab: "Tab 1",
        };
      case "select":
        return {
          ...base,
          type: block,
          options: ["Option 1", "Option 2"],
          displayState: "collapsed",
        };
      case "listItem":
        return { ...base, type: block, itemType: "basic", count: 3 };
      case "card":
        return { ...base, type: block, cardType: "basic", count: 3 };
      case "table":
        return {
          ...base,
          type: block,
          columns: ["Column 1", "Column 2", "Column 3"],
          count: 3,
        };
      default:
        return { ...base, type: block };
    }
  })();
  const node = createElementNode(element, parentNode as FrameNode);
  project.elements.push({ ...element, nodeId: node.id });
  if (node.type === "FRAME")
    for (const child of defaultAutoChildren({
      block,
      elements: project.elements,
      screenId,
      parentElementId: elementId,
      createId: id,
    })) {
      const childNode = createElementNode(child, node);
      // Header의 뒤로가기는 아이콘 버튼 크기, 테두리 없이 텍스트만 가운데
      if (
        block === "header" &&
        child.type === "button" &&
        childNode.type === "FRAME"
      ) {
        childNode.resize(40, 40);
        childNode.layoutSizingHorizontal = "FIXED";
        childNode.strokes = [];
        childNode.primaryAxisAlignItems = "CENTER";
        childNode.counterAxisAlignItems = "CENTER";
      }
      project.elements.push({ ...child, nodeId: childNode.id });
    }
  if (parentNode?.type === "FRAME")
    pinHeaderAndFooter(parentNode, project.elements);
  // Header에 새 블록 추가 시 기존 자식은 왼쪽 고정, 새 블록은 오른쪽 끝 배치
  if (parentElement?.type === "header" && parentNode?.type === "FRAME")
    parentNode.primaryAxisAlignItems = "SPACE_BETWEEN";
  if (!parentElementId) {
    if (block === "header" || block === "footer")
      pinEdgeToScreen(node, frame, block === "header" ? "top" : "bottom");
    syncScreenEdgePadding(frame, project.elements);
  }
  // order 정규화를 저장 전에 실행, 뒤이은 sync가 다시 저장하지 않게 방지
  await normalizeElementOrder(project);
  saveProject(project);
  figma.currentPage.selection = [parentNode as FrameNode];
  return { project, elementId };
}

// 형제 판정 기준은 model.order가 아니라 실제 Figma 자식 배열
async function visualSiblingsOf(project: Project, elementId: string) {
  const element = project.elements.find((item) => item.id === elementId);
  if (!element) return;
  const node = await figma.getNodeByIdAsync(element.nodeId);
  if (!node || !("parent" in node) || node.parent?.type !== "FRAME") return;
  const parent = node.parent;
  const siblingElementIds = new Set(
    elementSiblings(project.elements, element).map((item) => item.id),
  );
  const visualSiblings = parent.children.filter((child) =>
    siblingElementIds.has(child.getPluginData("sketchy:element-id")),
  );
  return { parent, node: node as SceneNode, visualSiblings };
}

export async function moveElement(elementId: string, direction: "up" | "down") {
  const project = readProject();
  const resolved = await visualSiblingsOf(project, elementId);
  if (!resolved) return project;
  const { parent, node, visualSiblings } = resolved;
  const index = visualSiblings.indexOf(node);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= visualSiblings.length)
    return project;
  const reordered = [...visualSiblings];
  [reordered[index], reordered[swapIndex]] = [
    reordered[swapIndex],
    reordered[index],
  ];
  applyOrder(parent, reordered);
  return project;
}

// 드래그 리오더: 목록 안 어디로든 한 번의 드롭으로 옮긴다, 화살표 버튼처럼
// 인접 스왑을 반복할 필요가 없다
export async function reorderElement(elementId: string, toIndex: number) {
  const project = readProject();
  const resolved = await visualSiblingsOf(project, elementId);
  if (!resolved) return project;
  const { parent, node, visualSiblings } = resolved;
  const fromIndex = visualSiblings.indexOf(node);
  const clampedToIndex = Math.max(
    0,
    Math.min(toIndex, visualSiblings.length - 1),
  );
  if (fromIndex === -1 || fromIndex === clampedToIndex) return project;
  const reordered = [...visualSiblings];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(clampedToIndex, 0, moved);
  applyOrder(parent, reordered);
  return project;
}

export async function updateElement(
  elementId: string,
  name: string,
  description: string,
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || !node) return project;
  element.name = name;
  element.description = description;
  const features = project.features.filter(
    (item) => item.trigger?.elementId === elementId,
  );
  for (const feature of features) {
    feature.name = name;
  }
  node.name = name;
  await loadFont();
  renderElementName(node as SceneNode, element.type, name);
  saveProject(project);
  return project;
}

export async function deleteElement(elementId: string) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  if (!element) return project;
  if (element.role === "popup")
    throw new Error(
      "Delete the popup state instead; the popup container is required.",
    );
  const node = await figma.getNodeByIdAsync(element.nodeId);
  node?.remove();
  const removed = elementTreeIds(project.elements, elementId);
  project.elements = project.elements.filter((item) => !removed.has(item.id));
  project.features = project.features.filter(
    (item) => !item.trigger?.elementId || !removed.has(item.trigger.elementId),
  );
  // Header/Footer 삭제 시 화면 패딩 복원은 뒤이은 sync의 cleanProject 담당
  saveProject(project);
  return project;
}

export async function selectElement(elementId: string) {
  const element = readProject().elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!node || !("visible" in node)) return;
  await focusNode(node);
}
