import { useState } from "react";
import { BLOCK_DEFINITIONS, type BlockType } from "../../../shared";
import { post } from "../../plugin";
import styles from "./Build.module.css";

// Quick add는 항상 이 4개만 고정, 사용 빈도가 늘어도 이 줄 길이는 안 바뀐다
const QUICK_FIXED: BlockType[] = ["text", "button", "input", "image"];

// feature-model의 Trigger 축(클릭 없음 / click / change·submit)을 그대로 쓴다,
// Picker 전용의 새 분류체계를 따로 만들지 않는다
const CATEGORIES: { key: string; label: string; blocks: BlockType[] }[] = [
  {
    key: "basic",
    label: "Basic",
    blocks: ["text", "image", "divider", "section"],
  },
  {
    key: "interactive",
    label: "Interactive",
    blocks: ["button", "listItem", "card", "tableRow", "tabs", "navigation"],
  },
  {
    key: "form",
    label: "Form",
    blocks: ["input", "select", "checkbox", "radio", "switch", "search"],
  },
];

export default function BlockPicker({
  screenId,
  sectionId,
  allowSection = true,
}: {
  screenId: string;
  sectionId?: string;
  allowSection?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [recent, setRecent] = useState<BlockType>();

  const allowed = (block: BlockType) => {
    const definition = BLOCK_DEFINITIONS[block];
    return (
      !sectionId ||
      (definition.canAddToSection && (block !== "section" || allowSection))
    );
  };

  const insert = (block: BlockType) => {
    post({ type: "INSERT_BLOCK", screenId, block, parentElementId: sectionId });
    if (!QUICK_FIXED.includes(block)) setRecent(block);
    setOpen(false);
  };

  const cell = (block: BlockType) => (
    <button
      className={styles.block}
      data-block={block}
      key={block}
      onClick={() => insert(block)}
    >
      <span className={styles.preview} aria-hidden="true">
        {block === "text" && "Aa"}
      </span>
      <span>{BLOCK_DEFINITIONS[block].label}</span>
    </button>
  );

  const activeCategory = CATEGORIES.find((item) => item.key === category)!;

  return (
    <section className={sectionId ? styles.sectionCanvas : undefined}>
      <h2>{sectionId ? "Add to section" : "Add something"}</h2>
      <div className={styles.blocks}>
        {QUICK_FIXED.filter(allowed).map(cell)}
        {recent && allowed(recent) && cell(recent)}
        <button
          className={`${styles.block} ${styles.more}`}
          onClick={() => setOpen(true)}
        >
          <span className={styles.preview} aria-hidden="true">
            +
          </span>
          <span>More…</span>
        </button>
      </div>
      {open && (
        <div className={styles.pickerOverlay} onClick={() => setOpen(false)}>
          <div
            className={styles.pickerSheet}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.pickerHead}>
              <b>{sectionId ? "Add to section" : "Add something"}</b>
              <button
                className={styles.pickerClose}
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.pickerTabs}>
              {CATEGORIES.map((item) => (
                <button
                  key={item.key}
                  aria-pressed={item.key === category}
                  onClick={() => setCategory(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className={styles.pickerBody}>
              <div className={styles.blocks}>
                {activeCategory.blocks.filter(allowed).map(cell)}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
