import type { Project, Screen } from "../../../shared";
import { id, loadFont } from "./utils";

// Popup과 같은 파생 Screen 메커니즘을 그대로 쓰되 Dim 없이, AFTER_TIMEOUT으로
// 스스로 닫힌다. 메시지는 일반 Text 블록 하나라 클릭해서 Name을 고치면 그게
// 곧 화면에 보이는 문구다 — Toast 전용 편집 UI를 따로 안 만들어도 된다
export async function createToastScreen(
  project: Project,
  baseScreenId: string,
): Promise<{ screen: Screen; node: FrameNode }> {
  await loadFont();
  const baseScreen = project.screens.find(
    (screen) => screen.id === baseScreenId && !screen.kind,
  );
  const source =
    baseScreen && (await figma.getNodeByIdAsync(baseScreen.nodeId));
  if (!baseScreen || source?.type !== "FRAME")
    throw new Error("Select a Sketchy screen, then try again.");

  const number =
    project.screens.filter(
      (screen) =>
        screen.kind === "toast" && screen.baseScreenId === baseScreenId,
    ).length + 1;
  const screenId = id();

  // overlayPositionType 등 위치 지정 프레임 속성은 Plugin API에서 읽기
  // 전용이라 Popup과 같은 트릭(화면 크기 투명 프레임 안에서 직접 배치)을 쓴다
  const frame = figma.createFrame();
  frame.name = `${baseScreen.name} · Toast ${number}`;
  frame.resize(source.width, source.height);
  frame.fills = [];
  frame.setPluginData("sketchy:type", "screen");
  frame.setPluginData("sketchy:screen-id", screenId);

  const chip = figma.createFrame();
  chip.name = "Toast";
  chip.resize(Math.min(280, frame.width - 48), 48);
  chip.cornerRadius = 8;
  chip.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
  frame.appendChild(chip);
  chip.x = (frame.width - chip.width) / 2;
  chip.y = frame.height - chip.height - 32;

  const elementId = id();
  const text = figma.createText();
  text.name = "Saved";
  text.characters = "Saved";
  text.fontSize = 13;
  text.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  text.setPluginData("sketchy:type", "element");
  text.setPluginData("sketchy:screen-id", screenId);
  text.setPluginData("sketchy:element-id", elementId);
  chip.appendChild(text);
  text.x = 16;
  text.y = 16;

  frame.x = source.x + source.width + 120;
  frame.y = source.y + (number - 1) * (source.height + 120);

  await frame.setReactionsAsync([
    {
      trigger: { type: "AFTER_TIMEOUT", timeout: 2 },
      actions: [{ type: "CLOSE" }],
    },
  ]);

  const screen = {
    id: screenId,
    nodeId: frame.id,
    name: frame.name,
    purpose: "",
    kind: "toast",
    baseScreenId,
  } satisfies Screen;
  project.screens.push(screen);
  project.elements.push({
    id: elementId,
    nodeId: text.id,
    screenId,
    name: text.characters,
    type: "text",
  });
  return { screen, node: frame };
}
