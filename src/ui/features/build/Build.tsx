import type {
  Element as SketchyElement,
  Project,
  Screen,
} from "../../../shared";
import BuildNavigation from "./BuildNavigation";
import ElementDetails from "./ElementDetails";
import ScreenEditor, { ScreenBrowser } from "./ScreenEditor";
import SectionEditor from "./SectionEditor";

type Props = {
  project: Project;
  screen?: Screen;
  element?: SketchyElement;
  insertedElementId?: string;
};

export default function Build({
  project,
  screen,
  element,
  insertedElementId,
}: Props) {
  if (!screen) return <ScreenBrowser project={project} />;
  return (
    <>
      <BuildNavigation project={project} screen={screen} element={element} />
      {element ? (
        <>
          {/* key로 element가 바뀔 때마다 다시 마운트, FeatureCaseEditor의
          draft 선택 상태 같은 로컬 state가 다른 Element로 새지 않게 한다 */}
          <ElementDetails
            key={element.id}
            project={project}
            element={element}
          />
          {element.type === "section" ? (
            <SectionEditor
              project={project}
              screenId={screen.id}
              section={element}
              selectedElementId={element?.id}
              insertedElementId={insertedElementId}
            />
          ) : null}
        </>
      ) : (
        <ScreenEditor
          project={project}
          screen={screen}
          insertedElementId={insertedElementId}
        />
      )}
    </>
  );
}
