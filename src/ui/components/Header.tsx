import styles from "./Header.module.css";

export type Tab = "build" | "flow" | "spec";

export default function Header({
  tab,
  context,
  onChange,
  onSettings,
}: {
  tab: Tab;
  context?: { title: string; onBack: () => void };
  onChange: (tab: Tab) => void;
  onSettings: () => void;
}) {
  if (context)
    return (
      <header className={styles.header}>
        <button className={styles.plain} onClick={context.onBack}>
          ← Back
        </button>
        <b>{context.title}</b>
      </header>
    );
  return (
    <header className={styles.header}>
      <b>Sketchy</b>
      <nav className={styles.tabs} aria-label="Views">
        {(["build", "flow", "spec"] as Tab[]).map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            aria-pressed={tab === item}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
        <button
          className={styles.settings}
          aria-label="Settings"
          onClick={onSettings}
        >
          ⚙
        </button>
      </nav>
    </header>
  );
}
