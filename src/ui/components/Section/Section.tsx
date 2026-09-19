import type { HTMLAttributes } from "react";
import styles from "./Section.module.css";

export default function Section({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={[styles.section, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
