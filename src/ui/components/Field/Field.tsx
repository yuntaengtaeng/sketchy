import type { ReactNode } from "react";
import styles from "./Field.module.css";

type Layout = "column" | "row";

/** label 텍스트와 컨트롤을 묶는 표준 폼 필드, column은 세로(기본), row는 체크박스처럼 가로 */
export default function Field({
  layout = "column",
  className,
  children,
}: {
  layout?: Layout;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={[styles[layout], className].filter(Boolean).join(" ")}>
      {children}
    </label>
  );
}
