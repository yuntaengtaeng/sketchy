import type { HTMLAttributes } from "react";
import styles from "./Chip.module.css";

// 상태나 종류를 짧게 표시하는 알약형 라벨
export default function Chip({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={[styles.chip, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
