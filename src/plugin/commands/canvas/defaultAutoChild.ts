import {
  nextElementName,
  type BlockType,
  type DomainElement,
} from "../../../shared/index.ts";
import { id } from "./utils.ts";

// Header/Footer 생성 시 바로 지울 수 있는 기본 자식들로 빈 상태 회피
export function defaultAutoChildren(
  block: BlockType,
  elements: DomainElement[],
  screenId: string,
  parentElementId: string,
): DomainElement[] {
  const base = (label: string) => ({
    id: id(),
    screenId,
    parentElementId,
    name: nextElementName(elements, screenId, label),
  });
  if (block === "header")
    return [
      { ...base("<-"), type: "button", buttonVariant: "outline" },
      { ...base("Page Title"), type: "text", textSize: "title" },
    ];
  if (block === "footer")
    return [{ ...base("Submit"), type: "button", buttonVariant: "filled" }];
  return [];
}
