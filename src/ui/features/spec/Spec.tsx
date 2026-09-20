import {
  buildScreenSpec,
  type ScreenSpecBehavior,
  type ScreenSpecIssue,
} from "../../../core/screen-spec";
import { BLOCK_DEFINITIONS, type Project, type Screen } from "../../../shared";
import Body from "../../components/Body/Body";
import Muted from "../../components/Muted/Muted";
import Section from "../../components/Section/Section";
import Title from "../../components/Title/Title";
import {
  elementDetail,
  outlineElements,
  type ElementOutline,
} from "./utils/describe";
import styles from "./Spec.module.css";

// Spec issue 코드를 짧은 사용자 문구로 변환
function issueLabel(issue: ScreenSpecIssue): string {
  switch (issue.code) {
    case "purpose-missing":
      return "Purpose missing";
    case "elements-missing":
      return "No visible elements";
    case "incoming-missing":
      return "No incoming connection";
    case "trigger-missing":
      return "Trigger not linked";
    case "destination-missing":
      return "Destination needed";
    case "outcome-missing":
      return "Outcome not described";
    default:
      return "Spec needs attention";
  }
}

// 행동의 조건과 trigger를 한 줄의 실행 맥락으로 조합
function behaviorContext(behavior: ScreenSpecBehavior): string {
  if (!behavior.condition) return behavior.trigger;
  return `When ${behavior.condition}, ${behavior.trigger}`;
}

// 선택 화면의 readiness와 읽기 가능한 명세 표시
export default function Spec({
  project,
  screen,
}: {
  project: Project;
  screen?: Screen;
}) {
  const spec = screen ? buildScreenSpec(project, screen) : undefined;
  const outline = outlineElements(spec?.elements ?? []);
  return (
    <Section className={styles.spec}>
      <Title as="h1" size="lg">
        {screen?.name || "Select a screen"}
      </Title>
      {screen && (
        <>
          <div className={styles.summary}>
            <span>{spec?.elements.length ?? 0} elements</span>
            <span>{spec?.behaviors.length ?? 0} behaviors</span>
            {!!spec?.issues.length && (
              <span>{spec.issues.length} need attention</span>
            )}
          </div>
          {!!spec?.issues.length && (
            <div className={styles.attention}>
              <Title>Needs attention</Title>
              <ul>
                {spec.issues.map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>{issueLabel(issue)}</li>
                ))}
              </ul>
            </div>
          )}
          {screen.purpose && (
            <>
              <Title>Purpose</Title>
              <Body>{screen.purpose}</Body>
            </>
          )}
          <Title>Visible elements, top to bottom</Title>
          {outline.length ? (
            <ElementList items={outline} />
          ) : (
            <Muted>No elements yet.</Muted>
          )}
          <Title>What users can do</Title>
          {spec?.behaviors.length ? (
            <ul className={styles.behaviors}>
              {spec.behaviors.map((behavior) => (
                <li
                  key={behavior.id}
                  className={behavior.needsAttention ? styles.issue : undefined}
                >
                  <strong>{behavior.name}</strong>
                  <Muted>{behaviorContext(behavior)}</Muted>
                  <Body>{behavior.result}</Body>
                  {behavior.note && <Muted>{behavior.note}</Muted>}
                </li>
              ))}
            </ul>
          ) : (
            <Muted>No behavior described yet.</Muted>
          )}
        </>
      )}
    </Section>
  );
}

// 요소 계층을 읽기 순서의 중첩 목록으로 표시
function ElementList({ items }: { items: ElementOutline[] }) {
  return (
    <ol className={styles.elements}>
      {items.map(({ element, number, children }) => {
        const detail = elementDetail(element);
        return (
          <li key={element.id}>
            <span>
              {number}. {element.name} ({BLOCK_DEFINITIONS[element.type].label}
              {detail ? `, ${detail}` : ""})
            </span>
            {element.description && <Muted>{element.description}</Muted>}
            {!!children.length && <ElementList items={children} />}
          </li>
        );
      })}
    </ol>
  );
}
