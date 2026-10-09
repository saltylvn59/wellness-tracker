import { useSyncExternalStore } from "react";
import { getLocalDateKey } from "@/lib/dates";

const noSubscribe = () => () => {};

/**
 * Today's date on the phone's clock ("YYYY-MM-DD"), for components marked "use client".
 * It's null while the page is first drawn on the server (which can't know your time
 * zone), then fills in on the phone.
 */
export function useToday(): string | null {
  return useSyncExternalStore(noSubscribe, getLocalDateKey, () => null);
}
