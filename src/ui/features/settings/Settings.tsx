import { useRef } from "react";
import {
  SCREEN_PRESETS,
  type ProjectImportPreview,
  type ProjectSettings,
  type ScreenPreset,
} from "../../../shared";
import { post } from "../../plugin";
import styles from "./Settings.module.css";

export default function Settings({
  settings,
  importPreview,
}: {
  settings: ProjectSettings;
  importPreview?: ProjectImportPreview;
}) {
  const importInput = useRef<HTMLInputElement>(null);
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
        <p className="muted">Export the current project for Codex or Claude.</p>
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
