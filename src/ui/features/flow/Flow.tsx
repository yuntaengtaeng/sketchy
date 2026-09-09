import type { Feature, Project } from "../../../shared";
import { post } from "../../plugin";
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
      (feature.action.type === "navigate" &&
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
        action.type === "navigate"
          ? project.screens.find(
              (screen) => screen.id === action.destinationScreenId,
            )
          : undefined;
      const state =
        action.type === "set-state"
          ? project.states.find((item) => item.id === action.stateId)
          : undefined;
      return (
        <div className={styles.connection} key={feature.id}>
          <button
            onClick={() => post({ type: "SELECT_SCREEN", screenId: source.id })}
          >
            {source.name}
          </button>
          <span>
            <small>{feature.name}</small>→
          </span>
          {action.type === "navigate" ? (
            destination ? (
              <button
                onClick={() =>
                  post({ type: "SELECT_SCREEN", screenId: destination.id })
                }
              >
                {destination.name}
              </button>
            ) : (
              <div>
                Choose destination
                <small> not linked</small>
              </div>
            )
          ) : (
            <div>
              {feature.description || state?.name || "Describe behavior"}
            </div>
          )}
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
      <h2>Project flow</h2>
      {!project.features.length && (
        <p className="muted">No behavior described yet.</p>
      )}
      {connections(project.features)}
    </section>
  );
}
