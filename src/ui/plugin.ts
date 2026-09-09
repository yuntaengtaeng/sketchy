import type { PluginMessage } from "../shared";

export const post = (pluginMessage: PluginMessage) =>
  parent.postMessage({ pluginMessage }, "*");
