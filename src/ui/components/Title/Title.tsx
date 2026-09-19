import type { HTMLAttributes } from "react";
import styles from "./Title.module.css";

type TitleProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2";
  size?: "md" | "lg";
};

export default function Title({
  as = "h2",
  size = "md",
  className,
  ...props
}: TitleProps) {
  const Tag = as;
  return (
    <Tag
      className={[styles.title, styles[size], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
