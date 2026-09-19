import type { DomainElement } from "../../../../shared";
import { PART } from "../../../canvas-name.ts";
import { clampCount, createLabel, hugFrame } from "./shared";

type CardContent = { primary?: string; secondary?: string };

function buildCard(
  cardType: "basic" | "media" | "stat",
  name: string,
  content?: CardContent,
) {
  const card = hugFrame("VERTICAL");
  card.name = name;
  card.itemSpacing = 6;
  card.paddingLeft =
    card.paddingRight =
    card.paddingTop =
    card.paddingBottom =
      12;
  card.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  card.strokeWeight = 1;
  card.cornerRadius = 6;
  card.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];

  if (cardType === "media") {
    const image = figma.createFrame();
    image.resize(1, 90);
    image.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.92, b: 0.9 } }];
    card.appendChild(image);
    // FILL은 image가 card에 붙은 뒤에만 설정할 수 있다
    image.layoutSizingHorizontal = "FILL";
  }

  if (cardType === "stat") {
    card.counterAxisAlignItems = "CENTER";
    card.appendChild(
      createLabel(content?.primary || "128", 22, { r: 0.15, g: 0.15, b: 0.15 }),
    );
    card.appendChild(
      createLabel(content?.secondary || "Label", 12, {
        r: 0.55,
        g: 0.55,
        b: 0.55,
      }),
    );
    return card;
  }

  card.appendChild(
    createLabel(content?.primary || "Title", 14, { r: 0.15, g: 0.15, b: 0.15 }),
  );
  card.appendChild(
    createLabel(content?.secondary || "Description", 12, {
      r: 0.55,
      g: 0.55,
      b: 0.55,
    }),
  );
  return card;
}

export function rebuildCards(
  container: FrameNode,
  cardType: "basic" | "media" | "stat",
  count?: number,
  items?: CardContent[],
) {
  for (const child of [...container.children])
    if (child.getPluginData(PART) === "card-item") child.remove();
  for (let index = 0; index < clampCount(count); index++) {
    const card = buildCard(cardType, `Card ${index + 1}`, items?.[index]);
    card.setPluginData(PART, "card-item");
    container.appendChild(card);
    card.layoutSizingHorizontal = "FILL";
  }
}

export function createCardNode(element: DomainElement & { type: "card" }) {
  const list = hugFrame("VERTICAL");
  list.itemSpacing = 10;
  list.fills = [];
  rebuildCards(list, element.cardType ?? "basic", element.count, element.items);
  return list;
}

export function renderCardType(
  node: FrameNode,
  cardType: "basic" | "media" | "stat",
  count?: number,
  items?: CardContent[],
) {
  rebuildCards(node, cardType, count, items);
}
