"use client";

/** Short physical tap feedback on supported mobile devices. */
export function tap(ms = 12): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* not supported / blocked — silently ignore */
    }
  }
}
