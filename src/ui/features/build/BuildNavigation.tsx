import { useEffect, useRef } from "react";
import type {
  Element as SketchyElement,
  Project,
  Screen,
} from "../../../shared";
import { elementAncestors, elementSiblings } from "../../../shared";
import { post } from "../../plugin";
import styles from "./Build.module.css";

export default function BuildNavigation({
  project,
  screen,
  element,
}: {
  project: Project;
  screen: Screen;
  element?: SketchyElement;
}) {
  const path = element
    ? [...elementAncestors(project.elements, element), element]
    : [];
  const siblings = element ? elementSiblings(project.elements, element) : [];
  const currentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", inline: "end" });
  }, [element?.id]);

  return (
    <section className={styles.contextNavigation}>
      <nav className={styles.breadcrumb} aria-label="Current selection">
        <button
          onClick={() => post({ type: "SELECT_SCREEN", screenId: screen.id })}
        >
          {screen.name}
        </button>
        {path.map((item) => {
          const current = item.id === element?.id;
          return (
            <span key={item.id} ref={current ? currentRef : undefined}>
              <span aria-hidden="true">/</span>
              {current ? (
                <b aria-current="page">{item.name}</b>
              ) : (
                <button
                  onClick={() =>
                    post({ type: "SELECT_ELEMENT", elementId: item.id })
                  }
                >
                  {item.name}
                </button>
              )}
            </span>
          );
        })}
      </nav>
      {element && siblings.length > 1 && (
        <label className={styles.levelPicker}>
          Switch in {parentName(project, screen, element)}
          <select
            value={element.id}
            onChange={(event) =>
              post({ type: "SELECT_ELEMENT", elementId: event.target.value })
            }
          >
            {siblings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.type}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}

function parentName(project: Project, screen: Screen, element: SketchyElement) {
  return (
    project.elements.find((item) => item.id === element.parentElementId)
      ?.name || screen.name
  );
}
