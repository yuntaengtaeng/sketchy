import { useEffect, useRef, useState, type ReactNode } from "react";
import { BLOCK_DEFINITIONS, type BlockType } from "../../../../shared";
import { SEARCH_ICON } from "../../../../shared/icons";
import Button from "../../../components/Button/Button";
import Section from "../../../components/Section/Section";
import Title from "../../../components/Title/Title";
import { post } from "../../../plugin";
import styles from "./BlockPicker.module.css";

// Quick add는 항상 이 5개만 고정, 사용 빈도가 늘어도 이 줄 길이는 안 바뀐다
const QUICK_FIXED: BlockType[] = [
  "text",
  "button",
  "input",
  "image",
  "section",
];

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
    blocks: ["button", "listItem", "card", "table", "tabs"],
  },
  {
    key: "form",
    label: "Form",
    blocks: ["input", "select", "checkbox", "radio", "switch", "search"],
  },
];

// 순수 CSS ::after만으로 표현하기 어려운(자식이 여러 개인) 스와치만 여기서
// 마크업으로 채운다, 나머지(button/input/image/divider/section/checkbox/
// radio/switch/select)는 BlockPicker.module.css의 data-block 규칙만으로 그린다.
// search는 shared/icons.ts의 SEARCH_ICON을 실제 캔버스 렌더러와 공유한다
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const COMPOSITE_PREVIEWS: Partial<Record<BlockType, ReactNode>> = {
  search: (
    <svg
      width={SEARCH_ICON.size}
      height={SEARCH_ICON.size}
      viewBox={`0 0 ${SEARCH_ICON.size} ${SEARCH_ICON.size}`}
      aria-hidden="true"
    >
      <circle
        cx={SEARCH_ICON.circle.cx}
        cy={SEARCH_ICON.circle.cy}
        r={SEARCH_ICON.circle.r}
        fill="none"
        stroke="currentColor"
        strokeWidth={SEARCH_ICON.strokeWidth}
      />
      <line
        x1={SEARCH_ICON.handle.x1}
        y1={SEARCH_ICON.handle.y1}
        x2={SEARCH_ICON.handle.x2}
        y2={SEARCH_ICON.handle.y2}
        stroke="currentColor"
        strokeWidth={SEARCH_ICON.strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  ),
  listItem: (
    <span className={styles.swListItem}>
      <i className={styles.swAvatar} />
      <span className={styles.swLines}>
        <i />
        <i />
      </span>
    </span>
  ),
  card: (
    <span className={styles.swCard}>
      <i />
      <i />
    </span>
  ),
  table: (
    <span className={styles.swTableRow}>
      <i />
      <i />
      <i />
    </span>
  ),
  tabs: (
    <span className={styles.swTabs}>
      <i />
      <i />
    </span>
  ),
};

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
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // 키보드만 쓰는 사용자를 위한 표준 모달 동작: 열리면 시트 안으로 포커스를
  // 옮기고, Esc로 닫히며, Tab이 시트 밖으로 새지 않게 가둔다. 닫히면 포커스를
  // 다시 트리거("More…")로 돌려준다
  useEffect(() => {
    if (!open) return;
    sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable =
        sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      moreButtonRef.current?.focus();
    };
  }, [open]);

  const allowed = (block: BlockType) => {
    const definition = BLOCK_DEFINITIONS[block];
    return (
      !sectionId ||
      (definition.canAddToSection && (block !== "section" || allowSection))
    );
  };

  const insert = (block: BlockType) => {
    post({ type: "INSERT_BLOCK", screenId, block, parentElementId: sectionId });
    setOpen(false);
  };

  const cell = (block: BlockType) => (
    <Button
      className={styles.block}
      data-block={block}
      key={block}
      onClick={() => insert(block)}
    >
      <span className={styles.preview} aria-hidden="true">
        {block === "text" && "Aa"}
        {COMPOSITE_PREVIEWS[block]}
      </span>
      <span>{BLOCK_DEFINITIONS[block].label}</span>
    </Button>
  );

  const activeCategory = CATEGORIES.find((item) => item.key === category)!;

  return (
    <Section className={sectionId ? styles.sectionCanvas : undefined}>
      <Title>{sectionId ? "Add to section" : "Add something"}</Title>
      <div className={styles.blocks}>
        {QUICK_FIXED.filter(allowed).map(cell)}
        <Button
          ref={moreButtonRef}
          className={`${styles.block} ${styles.more}`}
          onClick={() => setOpen(true)}
        >
          <span className={styles.preview} aria-hidden="true">
            +
          </span>
          <span>More…</span>
        </Button>
      </div>
      {open && (
        <div className={styles.pickerOverlay} onClick={() => setOpen(false)}>
          <div
            ref={sheetRef}
            className={styles.pickerSheet}
            role="dialog"
            aria-modal="true"
            aria-label={sectionId ? "Add to section" : "Add something"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.pickerHead}>
              <b>{sectionId ? "Add to section" : "Add something"}</b>
              <Button
                variant="plain"
                className={styles.pickerClose}
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </Button>
            </div>
            <div className={styles.pickerTabs}>
              {CATEGORIES.map((item) => (
                <Button
                  key={item.key}
                  aria-pressed={item.key === category}
                  onClick={() => setCategory(item.key)}
                >
                  {item.label}
                </Button>
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
    </Section>
  );
}
