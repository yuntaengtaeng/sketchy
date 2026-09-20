import { useCallback, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 180;

/** 페이드아웃 CSS 트랜지션이 끝난 뒤에야 실제 정리 동작을 실행하는 닫기 상태 */
export function useFadeClose(
  onClosed: () => void,
  durationMs = DEFAULT_DURATION_MS,
) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClosed, durationMs);
  }, [onClosed, durationMs]);

  return { closing, close };
}
