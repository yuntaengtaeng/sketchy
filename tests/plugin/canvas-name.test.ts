import assert from "node:assert/strict";
import test from "node:test";
import {
  adoptCanvasName,
  elementLabelText,
} from "../src/plugin/canvas-name.ts";

test("adopts meaningful Canvas names without erasing Sketchy names", () => {
  const item = { name: "Button" };

  assert.equal(adoptCanvasName(item, " Continue "), true);
  assert.equal(item.name, "Continue");
  assert.equal(adoptCanvasName(item, " "), false);
  assert.equal(item.name, "Continue");
});

// getPluginData/children만 흉내 낸 최소 FrameNode 모양, figma 전역이 없어도
// elementLabelText를 그대로 테스트할 수 있다
function fakeFrame(children: { part?: string; characters?: string }[]) {
  return {
    type: "FRAME",
    children: children.map((child) => ({
      type: child.characters === undefined ? "FRAME" : "TEXT",
      characters: child.characters,
      getPluginData: (key: string) =>
        key === "sketchy:part" ? (child.part ?? "") : "",
    })),
  } as unknown as BaseNode;
}

test("reads the name only from the node that actually renders it", () => {
  // search: "label" part 자식이 이름을 보여준다
  const search = fakeFrame([{ part: "label", characters: "메뉴 검색" }]);
  assert.equal(elementLabelText(search, "search"), "메뉴 검색");

  // input: 화면 텍스트는 Placeholder 소유, 이름과 무관하다
  const input = fakeFrame([{ part: "label", characters: "Type here..." }]);
  assert.equal(elementLabelText(input, "input"), undefined);

  // table: 이름을 보여주는 전용 텍스트가 없다
  const table = fakeFrame([{ part: "table-row" }]);
  assert.equal(elementLabelText(table, "table"), undefined);
});

test("adopting the same label text twice is stable, no A/B oscillation", () => {
  const element = { name: "Search" };
  const node = fakeFrame([{ part: "label", characters: "메뉴 검색" }]);

  assert.equal(
    adoptCanvasName(element, elementLabelText(node, "search")),
    true,
  );
  assert.equal(element.name, "메뉴 검색");
  assert.equal(
    adoptCanvasName(element, elementLabelText(node, "search")),
    false,
  );
  assert.equal(element.name, "메뉴 검색");
});
