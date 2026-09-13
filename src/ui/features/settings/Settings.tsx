import { useState } from "react";
import {
  SCREEN_PRESETS,
  type AuthSession,
  type ProjectSettings,
  type ScreenPreset,
  type SketchyAccount,
} from "../../../shared";
import { copyText, post } from "../../plugin";
import styles from "./Settings.module.css";

export default function Settings({
  settings,
  account,
  codexCommand,
}: {
  settings: ProjectSettings;
  account?: SketchyAccount;
  codexCommand: string;
}) {
  const [signInStatus, setSignInStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  async function signIn() {
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
          <>
            <p className="muted">Use Codex with this Figma file.</p>
            <button
              className={styles.connect}
              onClick={() => post({ type: "CONNECT_CODEX" })}
            >
              Connect Codex
            </button>
            <div className={styles.account}>
              <small>
                Signed in as <b>{account.email}</b>
              </small>
              <button onClick={() => post({ type: "SIGN_OUT" })}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">Sign in for future cloud features.</p>
            <button
              className={styles.connect}
              disabled={!!signInStatus}
              onClick={signIn}
            >
              Continue with Google
            </button>
            <small className={styles.note}>
              Build, Flow and Spec work without an account.
            </small>
          </>
        )}
        {signInStatus && (
          <p className={styles.status} role="status">
            {signInStatus}
          </p>
        )}
        {codexCommand && (
          <div className={styles.instructions} role="status">
            <b>Finish in your terminal</b>
            <textarea
              aria-label="Codex setup commands"
              readOnly
              value={codexCommand}
              onFocus={(event) => event.currentTarget.select()}
            />
            <button
              onClick={async () => {
                setCopyStatus(
                  (await copyText(codexCommand))
                    ? "Copied. Paste and run it in your terminal."
                    : "Select the commands above and press Ctrl+C.",
                );
              }}
            >
              Copy setup commands
            </button>
            {copyStatus && <small>{copyStatus}</small>}
          </div>
        )}
      </section>
    </>
  );
}
