import { forwardRef, type InputHTMLAttributes } from "react";
import controlStyles from "../formControl.module.css";

/** input의 공용 기본 룩(테두리·radius·패딩·포커스)을 소유하는 컴포넌트 */
const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={[controlStyles.control, className].filter(Boolean).join(" ")}
    {...props}
  />
));
TextInput.displayName = "TextInput";

export default TextInput;
