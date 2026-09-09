import { useMemo, useState } from "react";
import type { Project, Screen } from "../../shared";
import styles from "./Spec.module.css";

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
};

export default function Spec({
  project,
  screen,
}: {
  project: Project;
  screen?: Screen;
}) {
  const [copied, setCopied] = useState(false);
  const outgoing = useMemo(
    () =>
      project.interactions.filter((link) => {
        const source = project.elements.find(
          (item) => item.id === link.sourceElementId,
        );
        return source?.screenId === screen?.id;
      }),
    [project, screen],
  );
  const markdown = useMemo(() => {
    if (!screen) return "";
    const interactions = outgoing
      .map((link) => {
        const source = project.elements.find(
          (item) => item.id === link.sourceElementId,
        )!;
        const destination = project.screens.find(
          (item) => item.id === link.destinationScreenId,
        )!;
        return `### ${source.name}\n\n- Trigger: Click\n- Destination: ${destination.name}${source.description ? `\n- Description: ${source.description}` : ""}`;
      })
      .join("\n\n");
    return `# ${screen.name}\n\n## Purpose\n\n${screen.purpose || "Not described yet."}\n\n## Interactions\n\n${interactions || "No interactions yet."}`;
  }, [project, screen, outgoing]);

  return (
    <section className={styles.spec}>
      <div className={styles.title}>
        <h1>{screen?.name || "Select a screen"}</h1>
        {screen && (
          <button
            onClick={async () => {
              await copy(markdown);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? "Copied" : "Copy Markdown"}
          </button>
        )}
      </div>
      {screen && (
        <>
          <h2>Purpose</h2>
          <p>{screen.purpose || "Not described yet."}</p>
          <h2>Interactions</h2>
          {!outgoing.length && <p className="muted">No interactions yet.</p>}
          {outgoing.map((link) => {
            const source = project.elements.find(
              (item) => item.id === link.sourceElementId,
            )!;
            const destination = project.screens.find(
              (item) => item.id === link.destinationScreenId,
            )!;
            return (
              <div key={link.id}>
                <h3>{source.name}</h3>
                <p>Click · Navigate to {destination.name}</p>
                {source.description && <p>{source.description}</p>}
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}
