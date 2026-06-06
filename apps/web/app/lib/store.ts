"use client";

import { create } from "zustand";
import {
  DEFAULT_BRIDGE_PORT,
  parseBridgeMessage,
  type ClientMessage,
  type ConnectionPhase,
  type TvDevice,
  type TvState,
  type RemoteCommand,
} from "@relay/shared";

export type BridgeStatus = "idle" | "connecting" | "open" | "closed";

interface RelayState {
  bridgeStatus: BridgeStatus;
  devices: TvDevice[];
  phase: ConnectionPhase;
  connectedDevice: TvDevice | null;
  tvState: TvState | null;
  pairingHost: string | null;
  scanning: boolean;
  error: string | null;

  connectBridge: () => void;
  discover: () => void;
  connectTv: (host: string, name?: string) => void;
  sendCode: (code: string) => void;
  command: (command: RemoteCommand) => void;
  disconnectTv: () => void;
  forget: (host: string) => void;
  cancelPairing: () => void;
  clearError: () => void;
}

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function bridgeUrl(): string {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const port = process.env.NEXT_PUBLIC_BRIDGE_PORT ?? String(DEFAULT_BRIDGE_PORT);
  return `ws://${host}:${port}`;
}

export const useRelay = create<RelayState>((set, get) => {
  const send = (msg: ClientMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  };

  return {
    bridgeStatus: "idle",
    devices: [],
    phase: "idle",
    connectedDevice: null,
    tvState: null,
    pairingHost: null,
    scanning: false,
    error: null,

    connectBridge: () => {
      if (typeof window === "undefined") return;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return;
      }
      set({ bridgeStatus: "connecting" });

      let ws: WebSocket;
      try {
        ws = new WebSocket(bridgeUrl());
      } catch {
        set({ bridgeStatus: "closed" });
        scheduleReconnect(get);
        return;
      }
      socket = ws;

      ws.onopen = () => {
        set({ bridgeStatus: "open", error: null });
        send({ type: "hello" });
      };

      ws.onmessage = (ev) => {
        const msg = parseBridgeMessage(typeof ev.data === "string" ? ev.data : "");
        if (!msg) return;
        switch (msg.type) {
          case "devices":
            set({ devices: msg.devices, scanning: false });
            break;
          case "pairingRequired":
            set({ phase: "pairing", pairingHost: msg.host });
            break;
          case "connected":
            set({
              connectedDevice: msg.device,
              phase: "connected",
              pairingHost: null,
              error: null,
            });
            break;
          case "disconnected":
            set({
              connectedDevice: null,
              tvState: null,
              phase: "disconnected",
              pairingHost: null,
            });
            break;
          case "state":
            set({ tvState: msg.state });
            break;
          case "phase":
            set({ phase: msg.phase });
            break;
          case "error":
            set({ error: msg.message });
            break;
          default:
            break;
        }
      };

      ws.onclose = () => {
        socket = null;
        set({ bridgeStatus: "closed" });
        scheduleReconnect(get);
      };

      ws.onerror = () => {
        ws.close();
      };
    },

    discover: () => {
      set({ scanning: true });
      send({ type: "discover" });
    },

    connectTv: (host, name) => {
      set({ phase: "connecting", error: null });
      send({ type: "connect", host, name });
    },

    sendCode: (code) => send({ type: "sendCode", code }),

    command: (command) => send({ type: "command", command }),

    disconnectTv: () => send({ type: "disconnect" }),

    forget: (host) => send({ type: "forget", host }),

    cancelPairing: () => {
      send({ type: "disconnect" });
      set({ phase: "idle", pairingHost: null });
    },

    clearError: () => set({ error: null }),
  };
});

function scheduleReconnect(get: () => RelayState) {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    get().connectBridge();
  }, 2000);
}
