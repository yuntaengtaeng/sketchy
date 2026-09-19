import { forwardRef, type TextareaHTMLAttributes } from "react";
import controlStyles from "../formControl.module.css";
import styles from "./Textarea.module.css";

/** textarea의 공용 기본 룩(테두리·radius·패딩·세로 리사이즈)을 소유하는 컴포넌트 */
const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={[controlStyles.control, styles.textarea, className]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export default Textarea;
