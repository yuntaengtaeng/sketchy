import { useEffect, useMemo, useState } from "react";
import type { BlockType, PluginMessage, Project, UiMessage } from "../shared";

const empty: Project = { screens: [], elements: [], interactions: [] };
const post = (pluginMessage: PluginMessage) =>
  parent.postMessage({ pluginMessage }, "*");
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

export default function App() {
  const [project, setProject] = useState(empty);
  const [screenId, setScreenId] = useState<string>();
  const [elementId, setElementId] = useState<string>();
  const [tab, setTab] = useState<"build" | "flow" | "spec">("build");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const screen =
    project.screens.find((item) => item.id === screenId) || project.screens[0];
  const element = project.elements.find((item) => item.id === elementId);

  useEffect(() => {
    onmessage = ({ data }) => {
      const message = data.pluginMessage as UiMessage;
      if (message?.type === "STATE") {
        setProject(message.project);
        setScreenId(message.selectedScreenId);
        setElementId(message.selectedElementId);
        setError("");
      }
      if (message?.type === "ERROR") setError(message.message);
    };
    post({ type: "READY" });
  }, []);

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
    <main>
      <header>
        <div>
          <b>Sketchy</b>
          <small>Keep your wireframes sketchy.</small>
        </div>
        <nav>
          {(["build", "flow", "spec"] as const).map((item) => (
            <button
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>
      {error && <p className="error">{error}</p>}

      {tab === "build" && (
        <>
          <section>
            <h2>Screens</h2>
            <div className="row">
              <select
                value={screen?.id || ""}
                onChange={(event) => {
                  setScreenId(event.target.value);
                  post({ type: "SELECT_SCREEN", screenId: event.target.value });
                }}
              >
                <option value="">Select a screen</option>
                {project.screens.map((item) => (
                  <option value={item.id}>{item.name}</option>
                ))}
              </select>
              <button
                onClick={() =>
                  post({
                    type: "CREATE_SCREEN",
                    name: `Screen ${project.screens.length + 1}`,
                  })
                }
              >
                + Screen
              </button>
            </div>
          </section>
          {screen && (
            <>
              <section key={screen.id}>
                <h2>Screen details</h2>
                <label>
                  Name
                  <input
                    defaultValue={screen.name}
                    onBlur={(event) =>
                      post({
                        type: "UPDATE_SCREEN",
                        screenId: screen.id,
                        name: event.target.value,
                        purpose: screen.purpose,
                      })
                    }
                  />
                </label>
                <label>
                  Purpose
                  <textarea
                    defaultValue={screen.purpose}
                    placeholder="What can users do here?"
                    onBlur={(event) =>
                      post({
                        type: "UPDATE_SCREEN",
                        screenId: screen.id,
                        name: screen.name,
                        purpose: event.target.value,
                      })
                    }
                  />
                </label>
              </section>
              <section>
                <h2>Add something</h2>
                <div className="blocks">
                  {(["text", "button", "input"] as BlockType[]).map((block) => (
                    <button
                      onClick={() =>
                        post({
                          type: "INSERT_BLOCK",
                          screenId: screen.id,
                          block,
                        })
                      }
                    >
                      {block}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          {element && (
            <section key={element.id}>
              <h2>{element.type} details</h2>
              <label>
                Name
                <input
                  defaultValue={element.name}
                  onBlur={(event) =>
                    post({
                      type: "UPDATE_ELEMENT",
                      elementId: element.id,
                      name: event.target.value,
                      description: element.description || "",
                    })
                  }
                />
              </label>
              {element.type === "button" && (
                <>
                  <label>
                    Description
                    <textarea
                      defaultValue={element.description || ""}
                      placeholder="What happens when users click?"
                      onBlur={(event) =>
                        post({
                          type: "UPDATE_ELEMENT",
                          elementId: element.id,
                          name: element.name,
                          description: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Go to
                    <select
                      defaultValue={
                        project.interactions.find(
                          (item) => item.sourceElementId === element.id,
                        )?.destinationScreenId || ""
                      }
                      onChange={(event) =>
                        event.target.value &&
                        post({
                          type: "CREATE_INTERACTION",
                          sourceElementId: element.id,
                          destinationScreenId: event.target.value,
                        })
                      }
                    >
                      <option value="">Choose destination</option>
                      {project.screens
                        .filter((item) => item.id !== element.screenId)
                        .map((item) => (
                          <option value={item.id}>{item.name}</option>
                        ))}
                    </select>
                  </label>
                </>
              )}
            </section>
          )}
        </>
      )}

      {tab === "flow" && (
        <section>
          <h2>Project flow</h2>
          {!project.interactions.length && (
            <p className="muted">No connected buttons yet.</p>
          )}
          {project.interactions.map((link) => {
            const source = project.elements.find(
              (item) => item.id === link.sourceElementId,
            )!;
            const sourceScreen = project.screens.find(
              (item) => item.id === source.screenId,
            )!;
            const destination = project.screens.find(
              (item) => item.id === link.destinationScreenId,
            )!;
            return (
              <div className="flow">
                <button
                  onClick={() =>
                    post({ type: "SELECT_SCREEN", screenId: sourceScreen.id })
                  }
                >
                  {sourceScreen.name}
                </button>
                <span>
                  <small>{source.name}</small>→
                </span>
                <button
                  onClick={() =>
                    post({ type: "SELECT_SCREEN", screenId: destination.id })
                  }
                >
                  {destination.name}
                </button>
              </div>
            );
          })}
        </section>
      )}

      {tab === "spec" && (
        <section className="spec">
          <div className="title">
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
              {!outgoing.length && (
                <p className="muted">No interactions yet.</p>
              )}
              {outgoing.map((link) => {
                const source = project.elements.find(
                  (item) => item.id === link.sourceElementId,
                )!;
                const destination = project.screens.find(
                  (item) => item.id === link.destinationScreenId,
                )!;
                return (
                  <div>
                    <h3>{source.name}</h3>
                    <p>Click · Navigate to {destination.name}</p>
                    {source.description && <p>{source.description}</p>}
                  </div>
                );
              })}
            </>
          )}
        </section>
      )}
    </main>
  );
}
