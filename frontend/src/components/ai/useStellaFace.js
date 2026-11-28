import { useSyncExternalStore } from "react";

import { getCachedFace, subscribeToStellaFace } from "./stellaFaceStore";

export function useStellaFace() {
  return useSyncExternalStore(
    subscribeToStellaFace,
    getCachedFace,
    getCachedFace,
  );
}
