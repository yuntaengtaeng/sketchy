import type { HTMLAttributes } from "react";
import styles from "./Muted.module.css";

export default function Muted({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={[styles.muted, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
