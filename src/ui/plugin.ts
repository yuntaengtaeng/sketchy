import type { PluginMessage } from "../shared";

export const post = (pluginMessage: PluginMessage) =>
  parent.postMessage({ pluginMessage }, "*");

// figma.ui.resize는 완료 신호가 없어서, 실제 iframe이 바뀌었다고 볼 수 있는
// window resize 이벤트나 타임아웃 중 먼저 오는 쪽으로 완료를 판단한다
export function resizeUi(
  width: number,
  height: number,
  timeoutMs = 220,
): Promise<void> {
  post({ type: "RESIZE_UI", width, height });
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("resize", finish);
      window.clearTimeout(fallback);
      resolve();
    };
    window.addEventListener("resize", finish, { once: true });
    const fallback = window.setTimeout(finish, timeoutMs);
  });
}

export function download(
  fileName: string,
  contents: string,
  contentType = "application/json",
) {
  const url = URL.createObjectURL(new Blob([contents], { type: contentType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
