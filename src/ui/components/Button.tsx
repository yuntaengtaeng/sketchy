import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "default" | "danger";

/** 역할별로 통일된 시각 처리를 갖는 공용 버튼, 위치 지정은 className으로 각자 유지 */
export default function Button({
  variant = "default",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const variantClass = variant === "danger" ? styles.danger : undefined;
  return (
    <button
      type={type}
      className={[variantClass, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
