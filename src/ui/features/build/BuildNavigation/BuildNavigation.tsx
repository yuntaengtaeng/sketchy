import { useEffect, useRef } from "react";
import type {
  Element as SketchyElement,
  Project,
  Screen,
} from "../../../../shared";
import { elementAncestors, elementSiblings } from "../../../../shared";
import { post } from "../../../plugin";
import styles from "./BuildNavigation.module.css";
import { NewScreen, ScreenSelect } from "../ScreenEditor/ScreenEditor";

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
      <div className={styles.topRow}>
        {/* element가 선택 안 됐을 때는 breadcrumb이 화면 이름 하나뿐이라
        옆의 화면 전환 셀렉트와 같은 이름이 나란히 중복 표시된다, 그때는
        breadcrumb 자체를 비워 셀렉트 하나만 보이게 한다 */}
        {path.length > 0 && (
          <nav className={styles.breadcrumb} aria-label="Current selection">
            <button
              onClick={() =>
                post({ type: "SELECT_SCREEN", screenId: screen.id })
              }
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
        )}
        {/* 화면 전환은 이 한 곳에서만: ScreenEditor 하단의 "Other screens"를
        따로 두지 않는다(같은 SELECT_SCREEN을 두 곳에서 다르게 보여주면
        어느 쪽이 맞는 경로인지 헷갈린다는 실사용자 피드백). 요소 안에
        들어와 있을 때는 "지금 어디 있는지 확인하고 위로 이동"하는
        breadcrumb이 메인이라, 화면 전환은 그만큼 눌러서 보조로 둔다 */}
        <div
          className={styles.screenSwitcher}
          data-compact={path.length > 0 || undefined}
        >
          <ScreenSelect project={project} screen={screen} />
          {/* 요소 안에 들어와 있을 때 새 화면 만들기까지 얹으면 보조 영역이
          다시 커진다, 화면 만들기는 화면 단위 뷰로 나갔을 때 하면 된다 */}
          {path.length === 0 && <NewScreen project={project} />}
        </div>
      </div>
      {element && siblings.length > 1 && (
        <label className={styles.levelPicker}>
          {/* 부모 이름은 breadcrumb에 이미 나와 있어 여기서 또 말하지 않는다 */}
          Switch
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
