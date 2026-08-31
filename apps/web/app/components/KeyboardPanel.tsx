"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRelay } from "../lib/store";
import { tap } from "../lib/haptics";
import { CloseIcon, SendIcon } from "./icons";

export function KeyboardPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const typeText = useRelay((s) => s.typeText);
  const fieldReady = useRelay((s) => s.fieldReady);
  const [buffer, setBuffer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // On open, seed from whatever the TV says is in the focused field, then focus.
  useEffect(() => {
    if (open) {
      setBuffer(useRelay.getState().imeValue || "");
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Set the field to the typed text. No Enter — on TVs whose on-screen keyboard
  // holds the focus, Enter types the highlighted key instead of submitting.
  // Search UIs filter live, so the text landing is the search.
  const send = () => {
    tap();
    typeText(buffer);
  };

  const clearField = () => {
    tap(18);
    setBuffer("");
    typeText("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[28rem]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="slab m-3 flex flex-col gap-4 px-5 py-5">
              <div className="flex items-center justify-between">
                {fieldReady ? (
                  <span className="flex items-center gap-1.5 font-mono text-[0.66rem] uppercase tracking-wider text-signal">
                    <span
                      className="block h-1.5 w-1.5 rounded-full"
                      style={{
                        background: "var(--color-signal)",
                        boxShadow: "0 0 8px var(--color-signal)",
                      }}
                    />
                    field ready
                  </span>
                ) : (
                  <span className="eyebrow">keyboard · focus a TV search box first</span>
                )}
                <button
                  type="button"
                  aria-label="Close keyboard"
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-full border border-edge text-muted transition-colors hover:text-fg"
                >
                  <CloseIcon width={15} height={15} />
                </button>
              </div>

              <input
                ref={inputRef}
                value={buffer}
                onChange={(e) => setBuffer(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type your search…"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                aria-label="Text to send to the TV"
                className="w-full rounded-xl border border-edge bg-[var(--color-ink-2)] px-4 py-3 font-mono text-[0.95rem] font-medium text-fg outline-none transition-all placeholder:text-faint focus:border-signal focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-signal)_38%,transparent)]"
              />

              <button
                type="button"
                onClick={send}
                aria-label="Send text to the TV"
                className="ok-core key h-12 w-full text-[0.85rem] font-bold"
              >
                <span className="flex items-center gap-2">
                  <SendIcon width={18} height={18} />
                  Send to TV
                </span>
              </button>

              <p className="text-[0.72rem] leading-relaxed text-faint">
                The text appears in the TV&rsquo;s search box and results update
                live — no need to press enter. Works in most search boxes; if
                nothing shows, that app only takes voice or its own on-screen
                keyboard (use the D-pad).
              </p>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={clearField}
                  className="font-mono text-[0.66rem] uppercase tracking-wider text-muted transition-colors hover:text-[var(--color-danger)]"
                >
                  clear field
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
