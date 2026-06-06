"use client";

import type { BridgeStatus } from "../lib/store";
import type { ConnectionPhase, TvDevice } from "@relay/shared";

interface StatusBarProps {
  bridgeStatus: BridgeStatus;
  phase: ConnectionPhase;
  device: TvDevice | null;
  onDisconnect?: () => void;
}

function statusColor(connected: boolean, bridgeOk: boolean): string {
  if (connected) return "var(--color-signal)";
  if (!bridgeOk) return "var(--color-danger)";
  return "var(--color-muted)";
}

export function StatusBar({ bridgeStatus, phase, device, onDisconnect }: StatusBarProps) {
  const bridgeOk = bridgeStatus === "open";
  const connected = phase === "connected" && Boolean(device);
  const color = statusColor(connected, bridgeOk);

  const label = !bridgeOk
    ? "Bridge offline"
    : connected
      ? (device?.name ?? "Connected")
      : phase === "connecting"
        ? "Connecting…"
        : "Not connected";

  return (
    <header className="flex items-center justify-between gap-3 px-1">
      <div className="flex items-center gap-2.5">
        <span
          className="signal-dot block h-2 w-2"
          style={{ backgroundColor: "var(--color-signal)", color: "var(--color-signal)" }}
        />
        <span className="text-[0.95rem] font-bold tracking-[0.18em] text-fg">
          RELAY
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="surface flex items-center gap-2 py-1.5 pl-3 pr-3.5">
          <span
            className="block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span
            className="max-w-[9.5rem] truncate font-mono text-[0.72rem] font-medium"
            style={{ color: connected ? "var(--color-fg)" : "var(--color-muted)" }}
          >
            {label}
          </span>
        </div>

        {connected && onDisconnect && (
          <button
            type="button"
            onClick={onDisconnect}
            className="surface px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-wider text-muted transition-colors hover:text-fg"
          >
            Leave
          </button>
        )}
      </div>
    </header>
  );
}
