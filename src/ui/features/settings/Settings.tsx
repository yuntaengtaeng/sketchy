import { useState } from "react";
import {
  SCREEN_PRESETS,
  type AgentConnection,
  type AuthSession,
  type ProjectSettings,
  type ScreenPreset,
  type SketchyAccount,
  type SyncStatus,
} from "../../../shared";
import { copyText, post } from "../../plugin";
import styles from "./Settings.module.css";

const SYNC_STATUS_TEXT: Record<SyncStatus, string> = {
  syncing: "Syncing agent changes…",
  applied: "Agent changes applied",
  conflict: "Couldn't sync because this Figma file also changed. Try again.",
  "auth-expired": "Signed out because your session expired, sign in again.",
};

export default function Settings({
  settings,
  account,
  agentConnection,
  syncStatus,
}: {
  settings: ProjectSettings;
  account?: SketchyAccount;
  agentConnection?: AgentConnection;
  syncStatus?: SyncStatus;
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
            <p className="muted">Connect your Sketchy projects once.</p>
            <div className={styles.agentActions}>
              <button
                onClick={() => post({ type: "CONNECT_AGENT", agent: "codex" })}
              >
                Connect Codex
              </button>
              <button
                onClick={() =>
                  post({ type: "CONNECT_AGENT", agent: "claude-code" })
                }
              >
                Connect Claude Code
              </button>
              <button
                onClick={() => {
                  post({ type: "CONNECT_AGENT", agent: "claude-app" });
                  window.open(
                    "https://claude.ai/customize/connectors",
                    "_blank",
                  );
                }}
              >
                Connect Claude App
              </button>
            </div>
            <small className={styles.note}>
              Codex connects across the app, CLI, and IDE extension.
            </small>
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
        {syncStatus && (
          <p
            className={styles.status}
            role={syncStatus === "conflict" ? "alert" : "status"}
          >
            {SYNC_STATUS_TEXT[syncStatus]}
          </p>
        )}
        {agentConnection && (
          <div className={styles.instructions} role="status">
            <b>
              {agentConnection.agent === "claude-app"
                ? "Add a custom connector in Claude"
                : "Finish in your terminal"}
            </b>
            <textarea
              aria-label={`${agentConnection.agent} setup`}
              readOnly
              value={agentConnection.setup}
              onFocus={(event) => event.currentTarget.select()}
            />
            <button
              onClick={async () => {
                setCopyStatus(
                  (await copyText(agentConnection.setup))
                    ? agentConnection.agent === "claude-app"
                      ? "Copied. Paste it as the connector URL."
                      : "Copied. Paste and run it in your terminal."
                    : "Select the text above and press Ctrl+C.",
                );
              }}
            >
              {agentConnection.agent === "claude-app"
                ? "Copy MCP URL"
                : "Copy setup commands"}
            </button>
            {copyStatus && <small>{copyStatus}</small>}
          </div>
        )}
      </section>
    </>
  );
}
