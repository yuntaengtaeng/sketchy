import type { ProjectDocument } from "../core/project-change";
import type { AuthSession, PluginMessage, Project } from "../shared";
import { previewProjectImport } from "../core/project-import";
import { createProjectDocument } from "../core/project-change";
import {
  createScreen,
  deleteFeature,
  deleteElement,
  deleteScreen,
  duplicateScreen,
  insertBlock,
  moveElement,
  setButtonVariant,
  setCardType,
  setChecked,
  setCount,
  setInputPlaceholder,
  setListItemType,
  setSectionDirection,
  setSelectDisplayState,
  setSelectOptions,
  setTableColumns,
  setTabItems,
  setTabSelection,
  setTextSize,
  selectElement,
  selectScreen,
  saveFeature,
  updateElement,
  updateScreen,
} from "./commands/canvas";
import { applyProjectImport } from "./commands/apply-project-import";
import { renderFlow } from "./commands/render-flow";
import { SKETCHY_ENDPOINT } from "./commands/remote-sync";
import { createSyncLoop } from "./sync-loop";
import {
  cleanProject,
  readProject,
  readProjectMetadata,
  readSyncState,
  saveProjectSnapshot,
  updateProjectSettings,
  writeSyncState,
} from "./storage/project";

figma.showUI(__html__, { width: 360, height: 720, themeColors: true });

let suppressDocumentChange = false;
let redrawTimer: ReturnType<typeof setTimeout>;
let suppressTimer: ReturnType<typeof setTimeout>;
let pendingImport:
  { baseRevision: number; document: ProjectDocument } | undefined;
const AUTH_SESSION_KEY = "sketchy:auth-session";

async function readAuthSession() {
  return (await figma.clientStorage.getAsync(AUTH_SESSION_KEY)) as
    AuthSession | undefined;
}

async function postAuthState() {
  figma.ui.postMessage({
    type: "AUTH_STATE",
    account: (await readAuthSession())?.user,
  });
}

async function signOut() {
  await figma.clientStorage.deleteAsync(AUTH_SESSION_KEY);
  await postAuthState();
  syncLoop.stop();
}

// push, pull, projection 확인, 주기 폴링은 sync-loop 모듈에 위임
const syncLoop = createSyncLoop({
  readSession: readAuthSession,
  onProjectPulled: async (project) => {
    // Sidebar가 다른 탭이어도 보이도록 Canvas 위에도 알림, Settings 문구와 별개
    figma.notify("Agent changes applied to this file");
    await sync(project, true);
  },
  applyProjectImport,
  onStatusChange: (status) => {
    figma.ui.postMessage({ type: "SYNC_STATUS", status });
    // 인증 만료는 다시 로그인해야 하므로 로그아웃 상태로 되돌려 Sign-in 버튼을 노출
    if (status === "auth-expired") void signOut();
    if (status === "conflict")
      figma.notify("Couldn't sync, this Figma file also changed", {
        error: true,
      });
    if (status === "unsupported")
      figma.notify("Couldn't apply the latest agent changes to this file", {
        error: true,
      });
  },
});

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error)
    return String(error.message);
  return String(error);
}

function selection() {
  let node: BaseNode | null = figma.currentPage.selection[0] || null;
  while (node && !node.getPluginData("sketchy:screen-id") && "parent" in node)
    node = node.parent;
  return {
    selectedScreenId: node?.getPluginData("sketchy:screen-id") || undefined,
    selectedElementId: node?.getPluginData("sketchy:element-id") || undefined,
  };
}

async function sync(project: Project = readProject(), draw = false) {
  if (draw) {
    clearTimeout(suppressTimer);
    suppressDocumentChange = true;
  }
  try {
    project = await cleanProject(project);
    if (draw) await renderFlow(project);
    figma.ui.postMessage({ type: "STATE", project, ...selection() });
    void syncLoop.pushLocalChanges(project);
  } finally {
    if (draw)
      suppressTimer = setTimeout(() => (suppressDocumentChange = false), 200);
  }
}

figma.ui.onmessage = async (message: PluginMessage) => {
  try {
    if (message.type === "READY") {
      await postAuthState();
      await sync(readProject(), true);
      if (readSyncState().connected) syncLoop.start();
    }
    if (message.type === "SAVE_AUTH_SESSION") {
      await figma.clientStorage.setAsync(AUTH_SESSION_KEY, message.session);
      await postAuthState();
      if (readSyncState().connected) syncLoop.start();
    }
    if (message.type === "SIGN_OUT") await signOut();
    if (message.type === "CONNECT_AGENT") {
      const session = await readAuthSession();
      if (!session) throw new Error("Sign in before connecting Codex.");
      const project = await cleanProject(readProject());
      let metadata = readProjectMetadata();
      let document = createProjectDocument(
        project,
        metadata,
        figma.fileKey || "local-development",
      );
      const create = () =>
        fetch(`${SKETCHY_ENDPOINT}/api/v1/projects`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${session.token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(document),
        });
      let response = await create();
      if (response.status === 409) {
        const existing = await fetch(
          `${SKETCHY_ENDPOINT}/api/v1/projects/${encodeURIComponent(document.id)}`,
          { headers: { authorization: `Bearer ${session.token}` } },
        );
        if (!existing.ok) {
          metadata = {
            id: `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            revision: 0,
            updatedAt: new Date().toISOString(),
          };
          saveProjectSnapshot(project, metadata);
          document = createProjectDocument(
            project,
            metadata,
            figma.fileKey || "local-development",
          );
          response = await create();
        }
      }
      if (!response.ok && response.status !== 409)
        throw new Error("Could not connect this project. Try again.");
      writeSyncState({
        connected: true,
        lastSyncedRevision: metadata.revision,
      });
      syncLoop.start();
      figma.ui.postMessage({
        type: "AGENT_CONNECTION",
        connection: {
          agent: message.agent,
          setup:
            message.agent === "codex"
              ? `codex mcp add sketchy-figma --url "${SKETCHY_ENDPOINT}/mcp"\ncodex mcp login sketchy-figma`
              : message.agent === "claude-code"
                ? `claude mcp add --transport http --scope user sketchy-figma "${SKETCHY_ENDPOINT}/mcp"`
                : `${SKETCHY_ENDPOINT}/mcp`,
        },
      });
    }
    if (message.type === "EXPORT_PROJECT") {
      const document = createProjectDocument(
        await cleanProject(readProject()),
        readProjectMetadata(),
        figma.fileKey || "local-development",
      );
      figma.ui.postMessage({
        type: "PROJECT_EXPORT",
        fileName: "sketchy.project.json",
        contents: JSON.stringify(document, null, 2),
      });
    }
    if (message.type === "PREVIEW_PROJECT_IMPORT") {
      const current = createProjectDocument(
        await cleanProject(readProject()),
        readProjectMetadata(),
        figma.fileKey || "local-development",
      );
      const preview = previewProjectImport(current, message.contents);
      pendingImport = preview.valid
        ? {
            baseRevision: current.revision,
            document: JSON.parse(message.contents) as ProjectDocument,
          }
        : undefined;
      figma.ui.postMessage({
        type: "PROJECT_IMPORT_PREVIEW",
        preview,
      });
    }
    if (message.type === "APPLY_PROJECT_IMPORT") {
      if (
        !pendingImport ||
        pendingImport.document.revision !== message.revision ||
        readProjectMetadata().revision !== pendingImport.baseRevision
      )
        throw new Error("Review the latest agent changes again.");
      await sync(await applyProjectImport(pendingImport.document), true);
      figma.ui.postMessage({
        type: "PROJECT_IMPORT_PREVIEW",
        preview: {
          valid: false,
          applied: true,
          summary: ["Figma updated"],
          errors: [],
          warnings: ["Export again to mark the MCP project as synced."],
        },
      });
      pendingImport = undefined;
    }
    if (message.type === "UPDATE_PROJECT_SETTINGS")
      await sync(updateProjectSettings(message.settings));
    if (message.type === "CREATE_SCREEN")
      await sync(await createScreen(message.name), true);
    if (message.type === "DUPLICATE_SCREEN")
      await sync(await duplicateScreen(message.screenId), true);
    if (message.type === "DELETE_SCREEN")
      await sync(await deleteScreen(message.screenId), true);
    if (message.type === "INSERT_BLOCK")
      await sync(
        await insertBlock(
          message.screenId,
          message.block,
          message.parentElementId,
          message.buttonVariant,
        ),
      );
    if (message.type === "SET_BUTTON_VARIANT")
      await sync(await setButtonVariant(message.elementId, message.variant));
    if (message.type === "SET_SECTION_DIRECTION")
      await sync(
        await setSectionDirection(message.elementId, message.direction),
      );
    if (message.type === "SET_TEXT_SIZE")
      await sync(await setTextSize(message.elementId, message.size));
    if (message.type === "SET_CHECKED")
      await sync(await setChecked(message.elementId, message.checked));
    if (message.type === "SET_TAB_ITEMS")
      await sync(await setTabItems(message.elementId, message.items));
    if (message.type === "SET_TAB_SELECTION")
      await sync(await setTabSelection(message.elementId, message.selectedTab));
    if (message.type === "SET_SELECT_OPTIONS")
      await sync(await setSelectOptions(message.elementId, message.options));
    if (message.type === "SET_SELECT_DISPLAY_STATE")
      await sync(
        await setSelectDisplayState(message.elementId, message.displayState),
      );
    if (message.type === "SET_INPUT_PLACEHOLDER")
      await sync(
        await setInputPlaceholder(message.elementId, message.placeholder),
      );
    if (message.type === "SET_LIST_ITEM_TYPE")
      await sync(await setListItemType(message.elementId, message.itemType));
    if (message.type === "SET_CARD_TYPE")
      await sync(await setCardType(message.elementId, message.cardType));
    if (message.type === "SET_TABLE_COLUMNS")
      await sync(await setTableColumns(message.elementId, message.columns));
    if (message.type === "SET_COUNT")
      await sync(await setCount(message.elementId, message.count));
    if (message.type === "DELETE_ELEMENT")
      await sync(await deleteElement(message.elementId), true);
    if (message.type === "MOVE_ELEMENT")
      await sync(await moveElement(message.elementId, message.direction), true);
    if (message.type === "UPDATE_ELEMENT")
      await sync(
        await updateElement(
          message.elementId,
          message.name,
          message.description,
        ),
        true,
      );
    if (message.type === "UPDATE_SCREEN")
      await sync(
        await updateScreen(message.screenId, message.name, message.purpose),
        true,
      );
    if (message.type === "SAVE_FEATURE")
      await sync(
        await saveFeature(
          message.sourceElementId,
          message.action,
          message.featureId,
          message.condition,
          message.description,
        ),
        true,
      );
    if (message.type === "DELETE_FEATURE")
      await sync(await deleteFeature(message.featureId), true);
    if (message.type === "SELECT_SCREEN") await selectScreen(message.screenId);
    if (message.type === "SELECT_ELEMENT")
      await selectElement(message.elementId);
  } catch (error) {
    figma.ui.postMessage({
      type: "ERROR",
      message: errorMessage(error),
    });
  }
};

figma.on("selectionchange", () => sync());
void figma.loadAllPagesAsync().then(() =>
  figma.on("documentchange", () => {
    if (suppressDocumentChange) return;
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(() => sync(readProject(), true), 200);
  }),
);
