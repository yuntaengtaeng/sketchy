import styles from "./Header.module.css";

export type Tab = "build" | "flow" | "spec";

export default function Header({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <header className={styles.header}>
      <div>
        <b>Sketchy</b>
        <small>Keep your wireframes sketchy.</small>
      </div>
      <nav className={styles.tabs}>
        {(["build", "flow", "spec"] as Tab[]).map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </nav>
    </header>
  );
}
