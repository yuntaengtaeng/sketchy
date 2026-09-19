import { forwardRef, type ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "default" | "plain" | "danger";

const VARIANT_CLASSES: Record<Variant, (keyof typeof styles)[]> = {
  default: ["button"],
  plain: ["plain"],
  danger: ["plain", "danger"],
};

/** 역할별로 통일된 시각 처리를 갖는 공용 버튼, 위치 지정은 className으로 각자 유지 */
const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ variant = "default", className, type = "button", ...props }, ref) => {
  const classes = VARIANT_CLASSES[variant].map((name) => styles[name]);
  return (
    <button
      ref={ref}
      type={type}
      className={[...classes, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
});
Button.displayName = "Button";

export default Button;
