const isClick = (reaction: Reaction) => reaction.trigger?.type === "ON_CLICK";

const navigatesTo = (reaction: Reaction, destinationId: string) => {
  const actions =
    reaction.actions || (reaction.action ? [reaction.action] : []);
  return (
    isClick(reaction) &&
    actions.length === 1 &&
    actions[0].type === "NODE" &&
    actions[0].destinationId === destinationId
  );
};

const closesOverlay = (reaction: Reaction) => {
  const actions =
    reaction.actions || (reaction.action ? [reaction.action] : []);
  return (
    isClick(reaction) && actions.length === 1 && actions[0].type === "CLOSE"
  );
};

export function withoutMissingDestinations(
  reactions: readonly Reaction[],
  existingDestinationIds: Set<string>,
) {
  return reactions.filter((reaction) => {
    const actions =
      reaction.actions || (reaction.action ? [reaction.action] : []);
    return actions.every(
      (action) =>
        action.type !== "NODE" ||
        !action.destinationId ||
        existingDestinationIds.has(action.destinationId),
    );
  });
}

export function updateNavigation(
  reactions: readonly Reaction[],
  previousDestinationId?: string,
  destinationId?: string,
  navigation: "NAVIGATE" | "OVERLAY" = "NAVIGATE",
) {
  const owned = previousDestinationId
    ? reactions.findIndex((reaction) =>
        navigatesTo(reaction, previousDestinationId),
      )
    : -1;
  if (
    destinationId &&
    reactions.some((reaction, index) => index !== owned && isClick(reaction))
  )
    throw new Error("This button already has a Figma click interaction.");

  const next = reactions.filter((_, index) => index !== owned);
  if (destinationId)
    next.push({
      trigger: { type: "ON_CLICK" },
      actions: [
        {
          type: "NODE",
          destinationId,
          navigation: navigation as never,
          transition: null,
          preserveScrollPosition: false,
        },
      ],
    });
  return next;
}

export function updateCloseOverlay(
  reactions: readonly Reaction[],
  remove = false,
) {
  const owned = reactions.findIndex(closesOverlay);
  if (
    !remove &&
    reactions.some((reaction, index) => index !== owned && isClick(reaction))
  )
    throw new Error("This button already has a Figma click interaction.");
  const next = reactions.filter((_, index) => index !== owned);
  if (!remove)
    next.push({
      trigger: { type: "ON_CLICK" },
      actions: [{ type: "CLOSE" }],
    });
  return next;
}
