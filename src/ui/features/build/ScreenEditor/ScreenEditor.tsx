import type { Project, Screen } from "../../../../shared";
import { post } from "../../../plugin";
import Button from "../../../components/Button/Button";
import Field from "../../../components/Field/Field";
import Select from "../../../components/Select/Select";
import TextInput from "../../../components/TextInput/TextInput";
import Textarea from "../../../components/Textarea/Textarea";
import BlockPicker from "../BlockPicker/BlockPicker";
import styles from "./ScreenEditor.module.css";
import NodeList from "../NodeList/NodeList";
import type { OnboardingStep } from "../utils/onboarding";
import { OnboardingTarget } from "../OnboardingCoachmark/OnboardingCoachmark";

export function ScreenBrowser({ project }: { project: Project }) {
  const hasScreens = project.screens.some((screen) => !screen.kind);
  return (
    <section>
      <h2>Screens</h2>
      <div className={styles.screenPicker}>
        {hasScreens && <ScreenSelect project={project} />}
        <NewScreen project={project} />
      </div>
    </section>
  );
}

export default function ScreenEditor({
  project,
  screen,
  insertedElementId,
  onboardingStep,
}: {
  project: Project;
  screen: Screen;
  insertedElementId?: string;
  onboardingStep?: OnboardingStep;
}) {
  const derivedStates = project.screens.filter(
    (item) => item.baseScreenId === screen.id,
  );
  const removedScreenIds = new Set([
    screen.id,
    ...derivedStates.map((item) => item.id),
  ]);
  const incomingConnections = project.features.filter(
    (feature) =>
      "destinationScreenId" in feature.action &&
      !!feature.action.destinationScreenId &&
      removedScreenIds.has(feature.action.destinationScreenId),
  ).length;
  const deleteImpact = [
    derivedStates.length
      ? `${derivedStates.length} derived ${derivedStates.length === 1 ? "state" : "states"}`
      : "",
    incomingConnections
      ? `${incomingConnections} incoming ${incomingConnections === 1 ? "connection" : "connections"}`
      : "",
  ]
    .filter(Boolean)
    .join(" and ");
  const nodes = project.elements
    .filter(
      (element) => element.screenId === screen.id && !element.parentElementId,
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <>
      <section>
        <h2>{screen.kind ? "State" : "Screen"}</h2>
        <Field>
          Name
          <TextInput
            defaultValue={screen.name}
            onBlur={(event) =>
              post({
                type: "UPDATE_SCREEN",
                screenId: screen.id,
                name: event.target.value,
                purpose: screen.purpose,
              })
            }
          />
        </Field>
        <Field>
          Purpose
          <Textarea
            defaultValue={screen.purpose}
            placeholder="What can users do here?"
            onBlur={(event) =>
              post({
                type: "UPDATE_SCREEN",
                screenId: screen.id,
                name: screen.name,
                purpose: event.target.value,
              })
            }
          />
        </Field>
      </section>
      <OnboardingTarget active={onboardingStep === "add-button"}>
        <BlockPicker screenId={screen.id} />
      </OnboardingTarget>
      <OnboardingTarget active={onboardingStep === "select-element"}>
        <NodeList
          title={`Inside ${screen.name}`}
          nodes={nodes}
          insertedElementId={insertedElementId}
        />
      </OnboardingTarget>
      <section>
        {!screen.kind && (
          <Button
            className={styles.secondaryAction}
            onClick={() =>
              post({ type: "DUPLICATE_SCREEN", screenId: screen.id })
            }
          >
            Duplicate screen
          </Button>
        )}
        <Button
          variant="danger"
          className={styles.delete}
          onClick={() =>
            confirm(
              `Delete ${screen.name}?${deleteImpact ? ` This also removes ${deleteImpact}.` : ""} This cannot be undone.`,
            ) && post({ type: "DELETE_SCREEN", screenId: screen.id })
          }
        >
          Delete {screen.kind ? "state" : "screen"}
        </Button>
      </section>
    </>
  );
}

// BuildNavigation의 화면 전환 셀렉트와 공유, "다른 화면으로 전환"이라는 같은
// 기능을 두 곳에 따로 두지 않는다
export function ScreenSelect({
  project,
  screen,
}: {
  project: Project;
  screen?: Screen;
}) {
  return (
    <Select
      aria-label="Select screen"
      value={screen?.id || ""}
      onChange={(event) =>
        post({ type: "SELECT_SCREEN", screenId: event.target.value })
      }
    >
      <option value="">Select a screen</option>
      <optgroup label="Screens">
        {project.screens
          .filter((item) => !item.kind)
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
      </optgroup>
      {!!project.screens.some((item) => item.kind) && (
        <optgroup label="States">
          {project.screens
            .filter((item) => item.kind)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </optgroup>
      )}
    </Select>
  );
}

export function NewScreen({ project }: { project: Project }) {
  const hasScreens = project.screens.some((screen) => !screen.kind);
  return (
    <Button
      onClick={() =>
        post({
          type: "CREATE_SCREEN",
          name: `Screen ${project.screens.filter((screen) => !screen.kind).length + 1}`,
        })
      }
    >
      {hasScreens ? "+ Screen" : "Create first screen"}
    </Button>
  );
}
