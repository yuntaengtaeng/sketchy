import type {
  Element as SketchyElement,
  Project,
  Screen,
} from "../../../../shared";
import Button from "../../../components/Button/Button";
import Section from "../../../components/Section/Section";
import Select from "../../../components/Select/Select";
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
  const elements = project.elements
    .filter((item) => item.screenId === screen.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // 편집 대상 선택 메시지 전송
  const selectElement = (elementId: string) =>
    post({ type: "SELECT_ELEMENT", elementId });

  return (
    <Section className={styles.contextNavigation}>
      <div className={styles.topRow}>
        <span className={styles.controlLabel}>Screen</span>
        <ScreenSelect project={project} screen={screen} />
        <NewScreen project={project} />
      </div>
      {!!elements.length && (
        <div className={styles.levelPicker}>
          <span className={styles.controlLabel}>Focus</span>
          <Select
            aria-label="Focus element"
            value={element?.id ?? ""}
            onChange={(event) => selectElement(event.target.value)}
          >
            <option value="" disabled>
              Choose element
            </option>
            {elements.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.type})
              </option>
            ))}
          </Select>
          {element && (
            <Button
              variant="plain"
              className={styles.screenButton}
              onClick={() =>
                post({ type: "SELECT_SCREEN", screenId: screen.id })
              }
            >
              View screen
            </Button>
          )}
        </div>
      )}
    </Section>
  );
}
