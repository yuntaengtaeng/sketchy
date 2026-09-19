import Button from "../Button/Button";
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
      <Button variant="plain" onClick={onBack}>
        ← Back
      </Button>
      <b>{title}</b>
    </header>
  );
}
