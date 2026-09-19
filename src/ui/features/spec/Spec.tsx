import { BLOCK_DEFINITIONS, type Project, type Screen } from "../../../shared";
import Body from "../../components/Body/Body";
import Muted from "../../components/Muted/Muted";
import Section from "../../components/Section/Section";
import Title from "../../components/Title/Title";
import {
  describeFeature,
  elementDetail,
  outlineElements,
  type ElementOutline,
} from "./utils/describe";
import styles from "./Spec.module.css";

export default function Spec({
  project,
  screen,
}: {
  project: Project;
  screen?: Screen;
}) {
  const elements = project.elements.filter(
    (element) => element.screenId === screen?.id,
  );
  const outline = outlineElements(elements);
  const features = project.features.filter(
    (feature) => feature.screenId === screen?.id,
  );
  return (
    <Section className={styles.spec}>
      <Title as="h1" size="lg">
        {screen?.name || "Select a screen"}
      </Title>
      {screen && (
        <>
          {screen.purpose && (
            <>
              <Title>Purpose</Title>
              <Body>{screen.purpose}</Body>
            </>
          )}
          <Title>Visible elements · top to bottom</Title>
          {outline.length ? (
            <ElementList items={outline} />
          ) : (
            <Muted>No elements yet.</Muted>
          )}
          <Title>What users can do</Title>
          {features.length ? (
            <ul>
              {features.map((feature) => (
                <li key={feature.id}>{describeFeature(project, feature)}</li>
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
