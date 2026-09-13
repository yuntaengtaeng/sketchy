import {
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

  const elements = stored.elements || [];
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
