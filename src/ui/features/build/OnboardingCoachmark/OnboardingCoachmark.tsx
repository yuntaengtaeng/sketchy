import type { ReactNode } from "react";
import Button from "../../../components/Button/Button";
import type { OnboardingStep } from "../utils/onboarding";
import styles from "./OnboardingCoachmark.module.css";

const COPY: Record<OnboardingStep, { progress: string; title: string }> = {
  "create-screen": { progress: "1 of 5", title: "Create your first screen" },
  "select-screen": { progress: "1 of 5", title: "Select a screen" },
  "add-button": { progress: "2 of 5", title: "Add a Button" },
  "select-element": {
    progress: "3 of 5",
    title: "Select the interactive element",
  },
  "choose-result": { progress: "3 of 5", title: "Choose a result" },
  "view-flow": { progress: "4 of 5", title: "View the project flow" },
  "view-spec": { progress: "5 of 5", title: "Review the live spec" },
};

export function OnboardingTarget({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return active ? <div className={styles.target}>{children}</div> : children;
}

export default function OnboardingCoachmark({
  step,
  onSkip,
}: {
  step?: OnboardingStep;
  onSkip: () => void;
}) {
  if (!step) return null;
  const copy = COPY[step];
  return (
    <>
      <div className={styles.scrim} aria-hidden="true" />
      <aside className={styles.tip} role="status">
        <p>
          <small>{copy.progress}</small>
          <b>{copy.title}</b>
        </p>
        <Button variant="plain" className={styles.skip} onClick={onSkip}>
          Skip
        </Button>
      </aside>
    </>
  );
}
