import { useSyncExternalStore } from "react";
import { getTenantFromHost, type TenantInfo } from "@/lib/tenant";

const subscribeToNothing = () => () => {};

const SERVER_SNAPSHOT: TenantInfo = {
  slug: null,
  isCampus: false,
  isCustomDomain: false,
};

let clientSnapshot: TenantInfo | null = null;

const getTenantSnapshot = (): TenantInfo => {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }
  if (!clientSnapshot) {
    clientSnapshot = getTenantFromHost();
  }
  return clientSnapshot;
};

const getServerSnapshot = (): TenantInfo => SERVER_SNAPSHOT;

export function useTenantInfo(): TenantInfo {
  return useSyncExternalStore(
    subscribeToNothing,
    getTenantSnapshot,
    getServerSnapshot
  );
}
