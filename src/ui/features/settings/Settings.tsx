import {
  SCREEN_PRESETS,
  type ProjectSettings,
  type ScreenPreset,
} from "../../../shared";
import Button from "../../components/Button/Button";
import Muted from "../../components/Muted/Muted";
import Section from "../../components/Section/Section";
import Title from "../../components/Title/Title";
import CheckedField from "../../components/properties/CheckedField";
import { post } from "../../plugin";
import styles from "./Settings.module.css";

export default function Settings({ settings }: { settings: ProjectSettings }) {
  return (
    <>
      <Section>
        <Title>Screen</Title>
        <Muted>Default frame for new screens</Muted>
        <div className={styles.presets}>
          {(Object.keys(SCREEN_PRESETS) as ScreenPreset[]).map((preset) => {
            const option = SCREEN_PRESETS[preset];
            return (
              <Button
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
              </Button>
            );
          })}
        </div>
        <p className={styles.note}>Existing screens keep their current size.</p>
      </Section>
      <Section>
        <Title>Flow</Title>
        <CheckedField
          label="Show flow arrows on canvas"
          checked={settings.showFlowArrows}
          onChange={(showFlowArrows) =>
            post({
              type: "UPDATE_PROJECT_SETTINGS",
              settings: { ...settings, showFlowArrows },
            })
          }
        />
        <p className={styles.note}>
          Figma prototype links stay connected either way.
        </p>
      </Section>
    </>
  );
}
