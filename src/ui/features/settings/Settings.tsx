import { useRef, useState } from "react";
import {
  SCREEN_PRESETS,
  type AuthSession,
  type ProjectImportPreview,
  type ProjectSettings,
  type ScreenPreset,
  type SketchyAccount,
} from "../../../shared";
import { post } from "../../plugin";
import styles from "./Settings.module.css";

export default function Settings({
  settings,
  importPreview,
  account,
}: {
  settings: ProjectSettings;
  importPreview?: ProjectImportPreview;
  account?: SketchyAccount;
}) {
  const importInput = useRef<HTMLInputElement>(null);
  const [signInStatus, setSignInStatus] = useState("");

  async function connectAgent() {
    try {
      setSignInStatus("Opening Google sign-in…");
      const started = await fetch(
        "https://sketchy.dbsxo360.workers.dev/auth/plugin/start",
        { method: "POST" },
      );
      if (!started.ok) throw new Error("Could not start sign-in.");
      const login = (await started.json()) as {
        handoffId: string;
        pollToken: string;
        authorizationUrl: string;
        expiresAt: string;
      };
      window.open(login.authorizationUrl, "_blank");
      setSignInStatus("Complete sign-in in your browser…");

      while (Date.now() < Date.parse(login.expiresAt)) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const response = await fetch(
          "https://sketchy.dbsxo360.workers.dev/auth/plugin/session",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              handoffId: login.handoffId,
              pollToken: login.pollToken,
            }),
          },
        );
        if (response.status === 202) continue;
        if (!response.ok) throw new Error("Sign-in could not be completed.");
        const result = (await response.json()) as AuthSession & {
          status: "complete";
        };
        post({
          type: "SAVE_AUTH_SESSION",
          session: { token: result.token, user: result.user },
        });
        setSignInStatus("");
        return;
      }
      throw new Error("Sign-in timed out. Try again.");
    } catch (error) {
      setSignInStatus(
        error instanceof Error ? error.message : "Sign-in failed.",
      );
    }
  }
  return (
    <>
      <section>
        <h2>Screen</h2>
        <p className="muted">Default frame for new screens</p>
        <div className={styles.presets}>
          {(Object.keys(SCREEN_PRESETS) as ScreenPreset[]).map((preset) => {
            const option = SCREEN_PRESETS[preset];
            return (
              <button
                key={preset}
                className={styles.preset}
                aria-pressed={settings.screenPreset === preset}
                onClick={() =>
                  post({
                    type: "UPDATE_PROJECT_SETTINGS",
                    settings: { ...settings, screenPreset: preset },
                  })
                }
              >
                <b>{option.label}</b>
                <small>
                  {option.width} × {option.height}
                </small>
              </button>
            );
          })}
        </div>
        <p className={styles.note}>Existing screens keep their current size.</p>
      </section>
      <section>
        <h2>AI agents</h2>
        {account ? (
          <div className={styles.account}>
            <span>
              Connected as <b>{account.email}</b>
            </span>
            <button onClick={() => post({ type: "SIGN_OUT" })}>Sign out</button>
          </div>
        ) : (
          <>
            <p className="muted">
              Connect Codex or Claude and keep agent changes in sync.
            </p>
            <button
              className={styles.connect}
              disabled={!!signInStatus}
              onClick={connectAgent}
            >
              Connect AI agent
            </button>
            <small className={styles.note}>
              Google sign-in opens in your browser. Build, Flow and Spec remain
              available without an account.
            </small>
          </>
        )}
        {signInStatus && (
          <p className={styles.status} role="status">
            {signInStatus}
          </p>
        )}
        <p className={styles.legacy}>Or use the local file workflow</p>
        <button
          className={styles.export}
          onClick={() => post({ type: "EXPORT_PROJECT" })}
        >
          Export for Codex or Claude
        </button>
        <button
          className={styles.import}
          onClick={() => importInput.current?.click()}
        >
          Review agent changes
        </button>
        <input
          ref={importInput}
          className={styles.fileInput}
          type="file"
          accept="application/json,.json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file)
              post({
                type: "PREVIEW_PROJECT_IMPORT",
                contents: await file.text(),
              });
            event.target.value = "";
          }}
        />
        {importPreview && (
          <div className={styles.preview} role="status">
            <b>
              {importPreview.applied
                ? "Applied"
                : importPreview.valid
                  ? "Changes ready"
                  : "Cannot apply"}
            </b>
            {[...importPreview.summary, ...importPreview.errors].map((item) => (
              <span key={item}>{item}</span>
            ))}
            {importPreview.warnings.map((item) => (
              <span key={item} className={styles.warning}>
                {item}
              </span>
            ))}
            {importPreview.requiresExport && (
              <>
                <small>
                  Export the latest project, then ask the agent to try again.
                </small>
                <button
                  className={styles.apply}
                  onClick={() => post({ type: "EXPORT_PROJECT" })}
                >
                  Export latest project
                </button>
              </>
            )}
            {importPreview.valid && (
              <>
                <small>Figma has not been changed yet.</small>
                <button
                  className={styles.apply}
                  onClick={() =>
                    post({
                      type: "APPLY_PROJECT_IMPORT",
                      revision: importPreview.revision!,
                    })
                  }
                >
                  Apply to Figma
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </>
  );
}
