/**
 * Relay shared protocol — the single source of truth for every message that
 * crosses the WebSocket between the web UI and the local bridge.
 *
 * Keep this file free of any runtime dependencies so both Node (bridge) and
 * the browser (web) can import it cheaply.
 */

export const RELAY_PROTOCOL_VERSION = 1;

/** Default port the bridge listens on for the web UI. */
export const DEFAULT_BRIDGE_PORT = 8742;

/* -------------------------------------------------------------------------- */
/*  Remote commands                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Logical remote buttons supported in v1. The bridge maps each of these to the
 * appropriate Android KeyEvent code — the web UI never needs to know the codes.
 */
export type RemoteCommand =
  | "DPAD_UP"
  | "DPAD_DOWN"
  | "DPAD_LEFT"
  | "DPAD_RIGHT"
  | "DPAD_CENTER"
  | "BACK"
  | "HOME"
  | "VOLUME_UP"
  | "VOLUME_DOWN"
  | "MUTE"
  | "POWER";

export const REMOTE_COMMANDS: readonly RemoteCommand[] = [
  "DPAD_UP",
  "DPAD_DOWN",
  "DPAD_LEFT",
  "DPAD_RIGHT",
  "DPAD_CENTER",
  "BACK",
  "HOME",
  "VOLUME_UP",
  "VOLUME_DOWN",
  "MUTE",
  "POWER",
] as const;

/* -------------------------------------------------------------------------- */
/*  Devices                                                                    */
/* -------------------------------------------------------------------------- */

export interface TvDevice {
  /** Stable identifier — the LAN host/IP we connect to. */
  host: string;
  /** Friendly name advertised over mDNS, or a saved nickname. */
  name: string;
  /** Has this TV been paired before (we hold a trusted certificate)? */
  paired: boolean;
  /** Was this device seen on the network in the latest discovery sweep? */
  online: boolean;
}

export interface VolumeState {
  level: number;
  maximum: number;
  muted: boolean;
}

/** Live state of the currently connected TV. */
export interface TvState {
  host: string;
  powered?: boolean;
  volume?: VolumeState;
  currentApp?: string;
}

/* -------------------------------------------------------------------------- */
/*  Client → Bridge                                                            */
/* -------------------------------------------------------------------------- */

export type ClientMessage =
  | { type: "hello" }
  /** Trigger an mDNS discovery sweep; bridge replies with `devices`. */
  | { type: "discover" }
  /** List known devices (discovered this session + previously paired). */
  | { type: "listDevices" }
  /** Begin pairing / connecting to a TV. Emits `pairingRequired` if a code is needed. */
  | { type: "connect"; host: string; port?: number; name?: string }
  /** Send the 6-digit code the TV displayed during pairing. */
  | { type: "sendCode"; code: string }
  /** Press a remote button on the connected TV. */
  | { type: "command"; command: RemoteCommand }
  /** Drop the active TV connection. */
  | { type: "disconnect" }
  /** Forget a paired device (deletes its stored certificate). */
  | { type: "forget"; host: string }
  | { type: "ping" };

/* -------------------------------------------------------------------------- */
/*  Bridge → Client                                                            */
/* -------------------------------------------------------------------------- */

export type ConnectionPhase =
  | "idle"
  | "connecting"
  | "pairing"
  | "connected"
  | "disconnected"
  | "error";

export type BridgeMessage =
  | { type: "welcome"; protocolVersion: number; bridgeVersion: string }
  | { type: "devices"; devices: TvDevice[] }
  /** The TV is showing a 6-digit code; prompt the user to enter it. */
  | { type: "pairingRequired"; host: string }
  | { type: "paired"; host: string }
  | { type: "connected"; host: string; device: TvDevice }
  | { type: "disconnected"; host?: string; reason?: string }
  | { type: "state"; state: TvState }
  | { type: "phase"; phase: ConnectionPhase; host?: string }
  | { type: "error"; message: string; code?: string }
  | { type: "pong" };

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const msg = JSON.parse(raw);
    if (msg && typeof msg.type === "string") return msg as ClientMessage;
  } catch {
    /* ignore malformed input */
  }
  return null;
}

export function parseBridgeMessage(raw: string): BridgeMessage | null {
  try {
    const msg = JSON.parse(raw);
    if (msg && typeof msg.type === "string") return msg as BridgeMessage;
  } catch {
    /* ignore malformed input */
  }
  return null;
}
