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
};

export default function Build({ project, screen, element }: Props) {
  if (!screen) return <ScreenBrowser project={project} />;
  return (
    <>
      <BuildNavigation project={project} screen={screen} element={element} />
      {element ? (
        <>
          <ElementDetails project={project} element={element} />
          {element.type === "section" ? (
            <SectionEditor
              project={project}
              screenId={screen.id}
              section={element}
              selectedElementId={element?.id}
            />
          ) : null}
        </>
      ) : (
        <ScreenEditor project={project} screen={screen} />
      )}
    </>
  );
}
