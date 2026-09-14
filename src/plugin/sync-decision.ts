export type SyncAction = "idle" | "push" | "pull" | "conflict";

/**
 * 로컬, 원격, 마지막 동기화 revision 세 값만으로 다음 행동 판정하는 순수 함수
 * 양쪽 다 마지막 동기화보다 앞서 있으면 어느 쪽도 자동으로 덮어쓰지 않고 conflict 반환
 */
export function decideSync(
  localRevision: number,
  remoteRevision: number,
  lastSyncedRevision: number,
): SyncAction {
  const localAhead = localRevision > lastSyncedRevision;
  const remoteAhead = remoteRevision > lastSyncedRevision;
  if (localAhead && remoteAhead) return "conflict";
  if (localAhead) return "push";
  if (remoteAhead) return "pull";
  return "idle";
}
