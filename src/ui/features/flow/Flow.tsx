import { useState } from "react";
import type { Project } from "../../../shared";
import Button from "../../components/Button/Button";
import Muted from "../../components/Muted/Muted";
import Section from "../../components/Section/Section";
import Title from "../../components/Title/Title";
import { download } from "../../plugin";
import { buildProjectMarkdown } from "../spec/utils/describe";
import ConnectionList from "./ConnectionList/ConnectionList";
import FlowCanvas from "./FlowCanvas/FlowCanvas";
import { groupConnections } from "./utils/groupConnections";
import styles from "./Flow.module.css";

// 선택된 화면과 관련된 연결, 프로젝트 전체 흐름을 화면별로 묶어 보여주는 탭
export default function Flow({
  project,
  selectedScreenId,
}: {
  project: Project;
  selectedScreenId?: string;
}) {
  const [canvasOpen, setCanvasOpen] = useState(false);
  const selected = project.features.filter(
    (feature) =>
      feature.screenId === selectedScreenId ||
      ("destinationScreenId" in feature.action &&
        !!feature.action.destinationScreenId &&
        feature.action.destinationScreenId === selectedScreenId),
  );
  const screen = project.screens.find((item) => item.id === selectedScreenId);
  return (
    <Section>
      {!!selected.length && (
        <>
          <Title>Flow for {screen?.name}</Title>
          <ConnectionList groups={groupConnections(project, selected)} />
          <hr className={styles.divider} />
        </>
      )}
      <div className={styles.header}>
        <Title>Project flow</Title>
        <div className={styles.actions}>
          <Button
            disabled={!project.screens.length}
            onClick={() => setCanvasOpen(true)}
          >
            View as Canvas
          </Button>
          <Button
            disabled={!project.screens.length}
            onClick={() =>
              download(
                "sketchy-spec.md",
                buildProjectMarkdown(project),
                "text/markdown",
              )
            }
          >
            Export as Markdown
          </Button>
        </div>
      </div>
      {!project.features.length && <Muted>No behavior described yet.</Muted>}
      <ConnectionList groups={groupConnections(project, project.features)} />
      {canvasOpen && (
        <FlowCanvas project={project} onClose={() => setCanvasOpen(false)} />
      )}
    </Section>
  );
}
