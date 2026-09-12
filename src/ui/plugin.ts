import type { PluginMessage } from "../shared";

export const post = (pluginMessage: PluginMessage) =>
  parent.postMessage({ pluginMessage }, "*");

export function download(fileName: string, contents: string) {
  const url = URL.createObjectURL(
    new Blob([contents], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
