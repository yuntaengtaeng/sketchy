import assert from "node:assert/strict";
import test from "node:test";
import { defaultAutoChildren } from "../../src/plugin/commands/canvas/defaultAutoChild.ts";
import type { DomainElement } from "../../src/shared/index.ts";

test("header gets an outline back button and a page title text", () => {
  const children = defaultAutoChildren("header", [], "home", "header1");
  assert.equal(children.length, 2);
  assert.equal(children[0].type, "button");
  assert.equal(children[0].name, "<-");
  assert.equal(
    children[0].type === "button" && children[0].buttonVariant,
    "outline",
  );
  assert.equal(children[1].type, "text");
  assert.equal(children[1].name, "Page Title");
  assert.equal(children[1].type === "text" && children[1].textSize, "title");
});

test("footer gets a filled Submit button as its default child", () => {
  const children = defaultAutoChildren("footer", [], "home", "footer1");
  assert.equal(children.length, 1);
  assert.equal(children[0].type, "button");
  assert.equal(children[0].name, "Submit");
  assert.equal(
    children[0].type === "button" && children[0].buttonVariant,
    "filled",
  );
});

test("other block types get no auto children", () => {
  assert.deepEqual(defaultAutoChildren("section", [], "home", "section1"), []);
  assert.deepEqual(defaultAutoChildren("button", [], "home", "button1"), []);
});

test("a second header's auto children avoid reusing existing names", () => {
  const existing: DomainElement[] = [
    { id: "e1", screenId: "home", name: "<-", type: "button" },
    { id: "e2", screenId: "home", name: "Page Title", type: "text" },
  ];
  const children = defaultAutoChildren("header", existing, "home", "header2");
  assert.equal(children[0].name, "<- 2");
  assert.equal(children[1].name, "Page Title 2");
});
