import Button from "../Button/Button";
import styles from "./Header.module.css";

export type Tab = "build" | "flow" | "spec";

export default function Header({
  tab,
  onboardingTab,
  onChange,
  onSettings,
}: {
  tab: Tab;
  onboardingTab?: Tab;
  onChange: (tab: Tab) => void;
  onSettings: () => void;
}) {
  return (
    <header
      className={styles.header}
      data-onboarding={onboardingTab || undefined}
    >
      <b>Sketchy</b>
      <nav className={styles.tabs} aria-label="Views">
        {(["build", "flow", "spec"] as Tab[]).map((item) => (
          <Button
            key={item}
            data-onboarding={onboardingTab === item || undefined}
            aria-pressed={tab === item}
            onClick={() => onChange(item)}
          >
            {item}
          </Button>
        ))}
        <Button
          className={styles.settings}
          aria-label="Settings"
          onClick={onSettings}
        >
          ⚙
        </Button>
      </nav>
    </header>
  );
}
