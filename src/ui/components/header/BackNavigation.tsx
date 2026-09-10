import styles from "./Header.module.css";

export default function BackNavigation({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <header className={styles.header}>
      <button className={styles.plain} onClick={onBack}>
        ← Back
      </button>
      <b>{title}</b>
    </header>
  );
}
