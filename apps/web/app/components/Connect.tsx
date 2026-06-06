"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TvDevice } from "@relay/shared";
import { useRelay } from "../lib/store";
import { RefreshIcon, TvIcon, SignalIcon } from "./icons";

export function Connect() {
  const {
    bridgeStatus,
    devices,
    scanning,
    phase,
    pairingHost,
    error,
    discover,
    connectTv,
    forget,
  } = useRelay();

  // Kick off a scan as soon as the bridge is reachable.
  useEffect(() => {
    if (bridgeStatus === "open" && phase !== "pairing" && phase !== "connected") {
      discover();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgeStatus]);

  const pairing = phase === "pairing" && Boolean(pairingHost);

  return (
    <div className="mx-auto flex w-full max-w-[26rem] flex-col gap-6">
      <div className="flex items-center gap-2.5 px-1">
        <span
          className="signal-dot block h-2 w-2"
          style={{ backgroundColor: "var(--color-signal)", color: "var(--color-signal)" }}
        />
        <span className="text-[0.95rem] font-bold tracking-[0.18em] text-fg">RELAY</span>
      </div>

      <AnimatePresence mode="wait">
        {pairing ? (
          <CodeEntry key="code" host={pairingHost!} />
        ) : (
          <Finder
            key="finder"
            bridgeStatus={bridgeStatus}
            devices={devices}
            scanning={scanning}
            connecting={phase === "connecting"}
            onScan={discover}
            onConnect={connectTv}
            onForget={forget}
          />
        )}
      </AnimatePresence>

      {error && !pairing && (
        <p className="surface px-4 py-3 text-center font-mono text-[0.72rem] text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Finder — bridge check + discovered devices                         */
/* ------------------------------------------------------------------ */

function Finder({
  bridgeStatus,
  devices,
  scanning,
  connecting,
  onScan,
  onConnect,
  onForget,
}: {
  bridgeStatus: string;
  devices: TvDevice[];
  scanning: boolean;
  connecting: boolean;
  onScan: () => void;
  onConnect: (host: string, name?: string) => void;
  onForget: (host: string) => void;
}) {
  const bridgeOnline = bridgeStatus === "open";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Hero */}
      <div className="slab flex flex-col items-center gap-5 px-6 py-10 text-center">
        <ScanOrb scanning={scanning && bridgeOnline} />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.45rem] font-bold tracking-tight text-fg">
            {bridgeOnline ? "Find your TV" : "Waiting for the bridge"}
          </h1>
          <p className="max-w-[18rem] text-[0.86rem] font-medium leading-relaxed text-muted">
            {bridgeOnline
              ? "Make sure your TV is on and connected to this same WiFi network."
              : "Relay needs its local bridge running on a computer on your network."}
          </p>
        </div>

        {!bridgeOnline && (
          <code className="surface px-4 py-2.5 font-mono text-[0.78rem] text-signal">
            npm run dev:bridge
          </code>
        )}
      </div>

      {/* Device list */}
      {bridgeOnline && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="eyebrow">
              {devices.length > 0 ? `${devices.length} found` : "devices"}
            </span>
            <button
              type="button"
              onClick={onScan}
              className="flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-wider text-muted transition-colors hover:text-signal disabled:opacity-50"
              disabled={scanning}
            >
              <RefreshIcon
                width={13}
                height={13}
                className={scanning ? "animate-spin" : ""}
              />
              {scanning ? "scanning" : "rescan"}
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="surface px-4 py-6 text-center text-[0.82rem] font-medium text-muted">
              {scanning ? "Scanning your network…" : "No TVs found yet. Try rescanning."}
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {devices.map((d) => (
                <li key={d.host}>
                  <DeviceRow
                    name={d.name}
                    host={d.host}
                    online={d.online}
                    paired={d.paired}
                    busy={connecting}
                    onConnect={() => onConnect(d.host, d.name)}
                    onForget={() => onForget(d.host)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ScanOrb({ scanning }: { scanning: boolean }) {
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <div className="radar-ring h-28 w-28" />
      <div className="radar-ring h-20 w-20" />
      <div className="radar-ring h-12 w-12" />
      {scanning && <div className="radar absolute inset-0" />}
      <div
        className="relative grid h-12 w-12 place-items-center rounded-full"
        style={{
          color: "var(--color-signal)",
          background:
            "radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--color-signal) 22%, transparent), transparent 70%)",
        }}
      >
        <SignalIcon width={26} height={26} />
      </div>
    </div>
  );
}

function DeviceRow({
  name,
  host,
  online,
  paired,
  busy,
  onConnect,
  onForget,
}: {
  name: string;
  host: string;
  online: boolean;
  paired: boolean;
  busy: boolean;
  onConnect: () => void;
  onForget: () => void;
}) {
  return (
    <div className="surface group flex items-center gap-3 p-3 transition-colors hover:border-[color-mix(in_srgb,var(--color-signal)_35%,var(--color-edge-soft))]">
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-edge text-muted"
        style={{ color: online ? "var(--color-signal)" : "var(--color-faint)" }}
      >
        <TvIcon width={20} height={20} />
      </div>

      <button
        type="button"
        onClick={onConnect}
        disabled={busy}
        className="flex min-w-0 flex-1 flex-col items-start text-left disabled:opacity-60"
      >
        <span className="flex items-center gap-2 truncate text-[0.95rem] font-semibold text-fg">
          {name}
          {paired && (
            <span className="rounded-full border border-[var(--color-signal-dim)] px-1.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-wider text-signal">
              paired
            </span>
          )}
        </span>
        <span className="truncate font-mono text-[0.7rem] text-faint">
          {host} {online ? "· online" : "· offline"}
        </span>
      </button>

      {paired && (
        <button
          type="button"
          onClick={onForget}
          className="shrink-0 px-2 font-mono text-[0.62rem] uppercase tracking-wider text-faint opacity-0 transition-opacity hover:text-[var(--color-danger)] group-hover:opacity-100"
        >
          forget
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CodeEntry — 6-digit pairing code                                   */
/* ------------------------------------------------------------------ */

function CodeEntry({ host }: { host: string }) {
  const { sendCode, cancelPairing, error } = useRelay();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const submitted = useRef(false);

  const code = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (code.length === 6 && !submitted.current) {
      submitted.current = true;
      sendCode(code);
    }
    if (code.length < 6) submitted.current = false;
  }, [code, sendCode]);

  const setAt = (i: number, value: string) => {
    const clean = value.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
    if (!clean && value) return;
    setDigits((prev) => {
      const next = [...prev];
      next[i] = clean.slice(-1);
      return next;
    });
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const chars = e.clipboardData
      .getData("text")
      .replace(/[^0-9a-fA-F]/g, "")
      .toUpperCase()
      .slice(0, 6)
      .split("");
    if (chars.length) {
      setDigits([0, 1, 2, 3, 4, 5].map((n) => chars[n] ?? ""));
      refs.current[Math.min(chars.length, 5)]?.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.3, 1] }}
      className="slab flex flex-col items-center gap-6 px-6 py-9 text-center"
    >
      <div className="flex flex-col gap-1.5">
        <span className="eyebrow">pairing</span>
        <h1 className="text-[1.4rem] font-bold tracking-tight text-fg">
          Enter the code on your TV
        </h1>
        <p className="font-mono text-[0.72rem] text-faint">{host}</p>
      </div>

      <div className="flex gap-2" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="text"
            autoCapitalize="characters"
            maxLength={1}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            aria-label={`Digit ${i + 1}`}
            className="h-14 w-11 rounded-xl border border-edge bg-[var(--color-ink-2)] text-center font-mono text-xl font-semibold text-fg outline-none transition-all focus:border-signal focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-signal)_40%,transparent)]"
          />
        ))}
      </div>

      {error && (
        <p className="font-mono text-[0.72rem] text-[var(--color-danger)]">{error}</p>
      )}

      <button
        type="button"
        onClick={cancelPairing}
        className="font-mono text-[0.7rem] uppercase tracking-wider text-muted transition-colors hover:text-fg"
      >
        cancel
      </button>
    </motion.div>
  );
}
