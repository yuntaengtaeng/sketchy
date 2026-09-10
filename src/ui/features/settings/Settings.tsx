import {
  SCREEN_PRESETS,
  type ProjectSettings,
  type ScreenPreset,
} from "../../../shared";
import { post } from "../../plugin";
import styles from "./Settings.module.css";

export default function Settings({ settings }: { settings: ProjectSettings }) {
  return (
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
  );
}
