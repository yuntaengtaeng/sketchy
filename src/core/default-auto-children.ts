import {
  nextElementName,
  type BlockType,
  type DomainElement,
} from "../shared/index.ts";

// Header와 Footer에 필요한 기본 자식 요소 생성
export function defaultAutoChildren({
  block,
  elements,
  screenId,
  parentElementId,
  createId,
}: {
  block: BlockType;
  elements: DomainElement[];
  screenId: string;
  parentElementId: string;
  createId: () => string;
}): DomainElement[] {
  // 공통 부모와 화면 정보를 가진 기본 요소 생성
  const base = (label: string) => ({
    id: createId(),
    screenId,
    parentElementId,
    name: nextElementName(elements, screenId, label),
  });
  if (block === "header") {
    return [
      { ...base("<-"), type: "button", buttonVariant: "outline" },
      { ...base("Page Title"), type: "text", textSize: "title" },
    ];
  }
  if (block === "footer") {
    return [{ ...base("Submit"), type: "button", buttonVariant: "filled" }];
  }
  return [];
}
