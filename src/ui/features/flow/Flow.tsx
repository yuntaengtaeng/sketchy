import type { Feature, Project } from "../../../shared";
import Button from "../../components/Button/Button";
import Muted from "../../components/Muted/Muted";
import Section from "../../components/Section/Section";
import Title from "../../components/Title/Title";
import { download, post } from "../../plugin";
import { buildProjectMarkdown } from "../spec/utils/describe";
import styles from "./Flow.module.css";

export default function Flow({
  project,
  selectedScreenId,
}: {
  project: Project;
  selectedScreenId?: string;
}) {
  const selected = project.features.filter(
    (feature) =>
      feature.screenId === selectedScreenId ||
      ("destinationScreenId" in feature.action &&
        !!feature.action.destinationScreenId &&
        feature.action.destinationScreenId === selectedScreenId),
  );
  const connections = (features: Feature[]) =>
    features.map((feature) => {
      const source = project.screens.find(
        (screen) => screen.id === feature.screenId,
      );
      if (!source) return null;
      const action = feature.action;
      const destination =
        "destinationScreenId" in action
          ? project.screens.find(
              (screen) => screen.id === action.destinationScreenId,
            )
          : undefined;
      return (
        <div className={styles.connection} key={feature.id}>
          <Button
            onClick={() => post({ type: "SELECT_SCREEN", screenId: source.id })}
          >
            {source.name}
          </Button>
          <span>
            <small>
              {feature.name}
              {feature.condition ? ` · When ${feature.condition}` : ""}
            </small>
            →
          </span>
          {action.type === "toast" ? (
            <div>
              Show toast:{" "}
              {project.elements.find(
                (item) =>
                  item.screenId === destination?.id && item.type === "text",
              )?.name || "Not described"}
              {feature.description && <small>{feature.description}</small>}
            </div>
          ) : "destinationScreenId" in action ? (
            destination ? (
              <Button
                onClick={() =>
                  post({ type: "SELECT_SCREEN", screenId: destination.id })
                }
              >
                {destination.name}
              </Button>
            ) : (
              <div>
                Choose destination
                <small> not linked</small>
              </div>
            )
          ) : action.type === "close-overlay" ? (
            <div>
              Close popup
              {feature.description && <small>{feature.description}</small>}
            </div>
          ) : (
            <div>
              {feature.description || "Outcome not described"}
              <small>Not interactive</small>
            </div>
          )}
          {"destinationScreenId" in action &&
            action.type !== "toast" &&
            feature.description && <small>{feature.description}</small>}
        </div>
      );
    });
  const screen = project.screens.find((item) => item.id === selectedScreenId);
  return (
    <Section>
      {!!selected.length && (
        <>
          <Title>Flow for {screen?.name}</Title>
          {connections(selected)}
          <hr className={styles.divider} />
        </>
      )}
      <div className={styles.header}>
        <Title>Project flow</Title>
        <Button
          disabled={!project.screens.length}
          onClick={() =>
            download(
              "sketchy-spec.md",
              buildProjectMarkdown(project),
              "text/markdown",
            )
          }
        >
          Export as Markdown
        </Button>
      </div>
      {!project.features.length && <Muted>No behavior described yet.</Muted>}
      {connections(project.features)}
    </Section>
  );
}
