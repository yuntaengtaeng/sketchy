import { BLOCK_DEFINITIONS, type BlockType } from "../../../shared";
import { post } from "../../plugin";
import styles from "./Build.module.css";

const blocks = Object.entries(BLOCK_DEFINITIONS) as [
  BlockType,
  (typeof BLOCK_DEFINITIONS)[BlockType],
][];

export default function BlockPicker({
  screenId,
  sectionId,
}: {
  screenId: string;
  sectionId?: string;
}) {
  return (
    <section className={sectionId ? styles.sectionCanvas : undefined}>
      <h2>{sectionId ? "Add to section" : "Add something"}</h2>
      <div className={styles.blocks}>
        {blocks
          .filter(([, definition]) => !sectionId || definition.canAddToSection)
          .map(([block, definition]) => (
            <button
              className={styles.block}
              data-block={block}
              key={block}
              onClick={() =>
                post({
                  type: "INSERT_BLOCK",
                  screenId,
                  block,
                  parentElementId: sectionId,
                })
              }
            >
              <span className={styles.preview} aria-hidden="true">
                {block === "text" && "Aa"}
              </span>
              <span>{definition.label}</span>
            </button>
          ))}
      </div>
    </section>
  );
}
