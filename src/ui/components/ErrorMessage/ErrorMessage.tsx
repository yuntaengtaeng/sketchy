import type { HTMLAttributes } from "react";
import styles from "./ErrorMessage.module.css";

export default function ErrorMessage({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="alert"
      className={[styles.error, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
