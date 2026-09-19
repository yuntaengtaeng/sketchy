import {
  BLOCK_DEFINITIONS,
  type Feature,
  type FeatureAction,
  type Project,
} from "../../../shared";
import {
  describeFeatureActionIssue,
  TRIGGER_HINT,
} from "../../../core/feature-action-issue";
import {
  destinationNodeId,
  resolveReactionTarget,
} from "../../../core/resolve-reaction-target";
import { validateFeatureAction } from "../../../core/validate-feature-action";
import { readProject, saveProject } from "../../storage/project";
import {
  updateCloseOverlay,
  updateNavigation,
  withoutMissingDestinations,
} from "../sync-prototype";
import { id } from "./utils";
import { createOverlayScreen } from "./screen";
import { createToastScreen } from "./toast";

type ReactableNode = SceneNode & ReactionMixin;

/** 트리거 요소가 삭제된 목적지를 가리키던 기존 Reaction들을 걷어낸 목록 */
async function withoutStaleReactions(source: ReactableNode) {
  const destinationIds = source.reactions.flatMap((reaction) =>
    (reaction.actions || (reaction.action ? [reaction.action] : [])).flatMap(
      (action) =>
        action.type === "NODE" && action.destinationId
          ? [action.destinationId]
          : [],
    ),
  );
  const existingDestinationIds = new Set<string>();
  for (const destinationId of destinationIds)
    if (await figma.getNodeByIdAsync(destinationId))
      existingDestinationIds.add(destinationId);
  return withoutMissingDestinations(source.reactions, existingDestinationIds);
}

/** 트리거 요소가 가진 이전 Case들이 남긴 Reaction을 하나씩 지운 목록 */
function withoutPreviousReactions(
  reactions: readonly Reaction[],
  project: Project,
  previous: Feature[],
) {
  return previous.reduce((current, feature) => {
    if (feature.action.type === "close-overlay")
      return updateCloseOverlay(current, true);
    return updateNavigation(
      current,
      destinationNodeId(project, feature.action),
    );
  }, reactions);
}

/** 이 요소의 대표(조건 없는) Case, 실제 Figma Reaction은 이 Case만 반영한다 */
function primaryFeature(project: Project, sourceElementId: string) {
  return project.features.find(
    (feature) =>
      feature.trigger?.elementId === sourceElementId && !feature.condition,
  );
}

/** 저장 직후 트리거 요소의 Figma Reaction을 최신 Case 상태와 맞춘다 */
export async function syncReaction(
  source: ReactableNode,
  project: Project,
  previous: Feature[],
  sourceElementId: string,
) {
  const reactions = withoutPreviousReactions(
    await withoutStaleReactions(source),
    project,
    previous,
  );
  const target = resolveReactionTarget(
    project,
    primaryFeature(project, sourceElementId),
  );
  await source.setReactionsAsync(
    target.kind === "close"
      ? updateCloseOverlay(reactions)
      : updateNavigation(
          reactions,
          undefined,
          target.nodeId,
          target.navigation,
        ),
  );
}

/** click 트리거를 지원하는 요소와 그 Figma 노드, 아니면 안내 문구와 함께 예외 */
async function requireTriggerSource(project: Project, sourceElementId: string) {
  const element = project.elements.find((item) => item.id === sourceElementId);
  const source = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (
    !element ||
    !BLOCK_DEFINITIONS[element.type].triggers.some(
      (trigger) => trigger === "click",
    ) ||
    !source ||
    !("setReactionsAsync" in source)
  )
    throw new Error(TRIGGER_HINT);
  return { element, source: source as ReactableNode };
}

/** featureId를 지정했는데 그 Case가 이 요소 소유가 아니면 예외 */
function requireFeatureIndex(
  project: Project,
  sourceElementId: string,
  featureId?: string,
) {
  if (!featureId) return -1;
  const index = project.features.findIndex(
    (feature) =>
      feature.id === featureId &&
      feature.trigger?.elementId === sourceElementId,
  );
  if (index < 0)
    throw new Error(
      "This outcome no longer exists. Select the element and try again.",
    );
  return index;
}

/** overlay, toast가 목적지 없이 선택되면 그 자리에서 Screen을 만들어 붙인다 */
async function ensureDestination(
  project: Project,
  action: FeatureAction,
  elementScreenId: string,
  hasDestination: boolean,
): Promise<{ action: FeatureAction; createdScreen?: FrameNode }> {
  if (hasDestination || (action.type !== "overlay" && action.type !== "toast"))
    return { action };
  const create =
    action.type === "overlay" ? createOverlayScreen : createToastScreen;
  const created = await create(project, elementScreenId);
  return {
    action: { ...action, destinationScreenId: created.screen.id },
    createdScreen: created.node,
  };
}

/** 클릭 시 사라지는 상태 표시용 데코레이션, 결과가 바뀌면 다시 그려야 하니 지운다 */
function clearStateIndicator(source: ReactableNode) {
  if (source.type !== "FRAME") return;
  source.children
    .find((child) => child.getPluginData("sketchy:role") === "state-indicator")
    ?.remove();
}

/** 트리거 요소에 Case 하나를 저장하고 Figma Reaction까지 맞춘 결과 Project */
export async function saveFeature({
  sourceElementId,
  action: input,
  featureId,
  condition,
  description,
}: {
  sourceElementId: string;
  action: FeatureAction;
  featureId?: string;
  condition?: string;
  description?: string;
}) {
  const project = readProject();
  const { element, source } = await requireTriggerSource(
    project,
    sourceElementId,
  );

  const issue = validateFeatureAction(project, element, input, true);
  if (issue) throw new Error(describeFeatureActionIssue(issue, input));

  const previous = project.features.filter(
    (feature) => feature.trigger?.elementId === sourceElementId,
  );
  const featureIndex = requireFeatureIndex(project, sourceElementId, featureId);
  const hasDestination =
    "destinationScreenId" in input &&
    !!project.screens.find((screen) => screen.id === input.destinationScreenId);
  const { action, createdScreen } = await ensureDestination(
    project,
    input,
    element.screenId,
    hasDestination,
  );

  const feature: Feature = {
    id: featureId || id(),
    screenId: element.screenId,
    trigger: { type: "click", elementId: sourceElementId },
    name: element.name,
    condition: condition?.trim() || undefined,
    description: description?.trim() || undefined,
    action,
  };
  if (featureIndex < 0) project.features.push(feature);
  else project.features[featureIndex] = feature;
  clearStateIndicator(source);

  try {
    await syncReaction(source, project, previous, sourceElementId);
  } catch (error) {
    createdScreen?.remove();
    throw error;
  }
  saveProject(project);
  return project;
}

/** Case 하나를 지우고 트리거 요소의 Figma Reaction을 남은 Case 기준으로 다시 맞춘 결과 Project */
export async function deleteFeature(featureId: string) {
  const project = readProject();
  const feature = project.features.find((item) => item.id === featureId);
  const element = project.elements.find(
    (item) => item.id === feature?.trigger?.elementId,
  );
  const source = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!feature || !element || !source || !("setReactionsAsync" in source))
    throw new Error(
      "This outcome no longer exists. Select the element and try again.",
    );
  const previous = project.features.filter(
    (item) => item.trigger?.elementId === element.id,
  );
  project.features = project.features.filter((item) => item.id !== featureId);
  await syncReaction(source, project, previous, element.id);
  saveProject(project);
  return project;
}
