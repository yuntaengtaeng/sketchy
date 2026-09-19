import type { Feature, Project } from "../../../shared";
import Button from "../../components/Button/Button";
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
    <section>
      {!!selected.length && (
        <>
          <h2>Flow for {screen?.name}</h2>
          {connections(selected)}
          <hr className={styles.divider} />
        </>
      )}
      <div className={styles.header}>
        <h2>Project flow</h2>
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
      {!project.features.length && (
        <p className="muted">No behavior described yet.</p>
      )}
      {connections(project.features)}
    </section>
  );
}
