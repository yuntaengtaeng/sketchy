import styles from "./Header.module.css";

export type Tab = "build" | "flow" | "spec";

export default function Header({
  tab,
  onChange,
  onSettings,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
  onSettings: () => void;
}) {
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
