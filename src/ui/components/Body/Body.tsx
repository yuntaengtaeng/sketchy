import type { HTMLAttributes } from "react";
import styles from "./Body.module.css";

type BodyProps = HTMLAttributes<HTMLElement> & {
  as?: "p" | "span";
};

export default function Body({ as = "p", className, ...props }: BodyProps) {
  const Tag = as;
  return (
    <Tag
      className={[styles.body, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
