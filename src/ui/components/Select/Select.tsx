import { forwardRef, type SelectHTMLAttributes } from "react";
import controlStyles from "../formControl.module.css";

/** select의 공용 기본 룩(테두리·radius·패딩·포커스)을 소유하는 컴포넌트 */
const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={[controlStyles.control, className].filter(Boolean).join(" ")}
    {...props}
  />
));
Select.displayName = "Select";

export default Select;
