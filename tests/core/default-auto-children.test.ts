import assert from "node:assert/strict";
import test from "node:test";
import { defaultAutoChildren } from "../../src/core/default-auto-children.ts";
import type { DomainElement } from "../../src/shared/index.ts";

test("header gets an outline back button and a page title text", () => {
  let nextId = 1;
  const children = defaultAutoChildren({
    block: "header",
    elements: [],
    screenId: "home",
    parentElementId: "header1",
    createId: () => `generated-${nextId++}`,
  });
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
  assert.equal(children[0].parentElementId, "header1");
  assert.deepEqual(
    children.map((child) => child.id),
    ["generated-1", "generated-2"],
  );
});

test("footer gets a filled Submit button as its default child", () => {
  const children = defaultAutoChildren({
    block: "footer",
    elements: [],
    screenId: "home",
    parentElementId: "footer1",
    createId: () => "generated-id",
  });
  assert.equal(children.length, 1);
  assert.equal(children[0].type, "button");
  assert.equal(children[0].name, "Submit");
  assert.equal(
    children[0].type === "button" && children[0].buttonVariant,
    "filled",
  );
});

test("other block types get no auto children", () => {
  for (const block of ["section", "button"] as const) {
    assert.deepEqual(
      defaultAutoChildren({
        block,
        elements: [],
        screenId: "home",
        parentElementId: "parent",
        createId: () => "generated-id",
      }),
      [],
    );
  }
});

test("a second header's auto children avoid reusing existing names", () => {
  const existing: DomainElement[] = [
    { id: "e1", screenId: "home", name: "<-", type: "button" },
    { id: "e2", screenId: "home", name: "Page Title", type: "text" },
  ];
  const children = defaultAutoChildren({
    block: "header",
    elements: existing,
    screenId: "home",
    parentElementId: "header2",
    createId: () => "generated-id",
  });
  assert.equal(children[0].name, "<- 2");
  assert.equal(children[1].name, "Page Title 2");
});
