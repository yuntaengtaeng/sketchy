import { useState } from "react";
import type { Tab } from "../components/header";

type Route = { name: "workspace" } | { name: "settings" };

const DEFAULT_ROUTE: Route = { name: "workspace" };

/** 탭 전환과 Settings 진입/복귀를 하나로 묶은 화면 이동 상태 */
export function useRoute(
  initialTab: Tab = "build",
  initialRoute = DEFAULT_ROUTE,
) {
  const [tab, setTab] = useState(initialTab);
  const [route, setRoute] = useState(initialRoute);

  return {
    tab,
    route,
    selectTab: (nextTab: Tab) => {
      setTab(nextTab);
      setRoute({ name: "workspace" });
    },
    openSettings: () => setRoute({ name: "settings" }),
    closeSettings: () => setRoute({ name: "workspace" }),
  };
}
