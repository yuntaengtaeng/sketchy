import {
  BLOCK_DEFINITIONS,
  SCREEN_PRESETS,
  type Element,
  type Feature,
  type FeatureAction,
  type Project,
} from "../../shared/index.ts";

type LegacyAction = { type: "toggle-state" } | { type: "set-state" };

type LegacyFeature = Omit<Feature, "action"> & {
  action: FeatureAction | LegacyAction;
  sourceElementId?: string;
};

type LegacyInteraction = {
  id: string;
  sourceElementId: string;
  destinationScreenId: string;
};

type StoredProject = Partial<Omit<Project, "features">> & {
  features?: LegacyFeature[];
  interactions?: LegacyInteraction[];
};

export function parseStoredProject(contents: string): StoredProject {
  return JSON.parse(contents) || {};
}

export function migrateStoredProject(stored: StoredProject): Project {
  let screenPreset: Project["settings"]["screenPreset"] = "mobile";
  const storedPreset = stored.settings?.screenPreset;
  if (typeof storedPreset === "string" && storedPreset in SCREEN_PRESETS)
    screenPreset = storedPreset;

  const elements = migrateElements(stored.elements || []);
  let features: Feature[];
  if (stored.features) features = stored.features.map(migrateFeature);
  else
    features = (stored.interactions || []).map((interaction) =>
      migrateInteraction(interaction, elements),
    );

  return {
    settings: { screenPreset },
    screens: stored.screens || [],
    elements,
    features,
  };
}

// 삭제된 블록 타입(예: navigation)이나 삭제된 속성(예: 예전 Button layout)이
// Figma 파일에 그대로 남아있으면 서버 스키마가 매번 push를 거절하므로
// 저장된 값을 읽을 때 미리 걸러낸다
function migrateElements(elements: Element[]): Element[] {
  return elements
    .filter((element) => element.type in BLOCK_DEFINITIONS)
    .map((element) => {
      if ("layout" in element) {
        const { layout: _layout, ...rest } = element as Element & {
          layout?: unknown;
        };
        return rest as Element;
      }
      return element;
    });
}

function migrateFeature(feature: LegacyFeature): Feature {
  let action: FeatureAction;
  if (isLegacyAction(feature.action)) {
    action = { type: "describe" };
  } else {
    action = feature.action;
  }

  let trigger = feature.trigger;
  if (!trigger && feature.sourceElementId) {
    trigger = { type: "click", elementId: feature.sourceElementId };
  }

  const { sourceElementId: _, ...current } = feature;
  return { ...current, action, trigger };
}

function isLegacyAction(
  action: FeatureAction | LegacyAction,
): action is LegacyAction {
  return action.type === "toggle-state" || action.type === "set-state";
}

function migrateInteraction(
  interaction: LegacyInteraction,
  elements: Element[],
): Feature {
  const source = elements.find(
    (element) => element.id === interaction.sourceElementId,
  );
  return {
    id: interaction.id,
    screenId: source?.screenId || "",
    name: source?.name || "Feature",
    trigger: { type: "click", elementId: interaction.sourceElementId },
    action: {
      type: "navigate",
      destinationScreenId: interaction.destinationScreenId,
    },
  };
}
