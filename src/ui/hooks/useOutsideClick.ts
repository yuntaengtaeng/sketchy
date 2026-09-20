import { useEffect, useRef, type RefObject } from "react";

/** ref 요소 바깥을 누르면 최신 콜백을 실행하는 훅 */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
) {
  const callback = useRef(onOutside);
  callback.current = onOutside;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback.current();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [ref]);
}
