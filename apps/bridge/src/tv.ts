import { EventEmitter } from "node:events";
import type { Socket } from "node:net";
import { AndroidRemote } from "androidtv-remote";
import { ImeChannel, type ImeFieldEvent } from "./ime.js";
import type {
  BridgeMessage,
  RemoteCommand,
  NamedKey,
  TvState,
} from "@relay/shared";
import {
  getDevice,
  saveDevice,
  touchDevice,
  removeDevice,
} from "./store.js";
import { keyCodeFor, keyCodeForNamed, SHORT_PRESS } from "./keymap.js";

function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

/**
 * Manages a single active Android TV connection and translates the
 * `androidtv-remote` event stream into Relay protocol messages. Emits a
 * `"message"` event carrying a {@link BridgeMessage} for the server to fan out.
 */
export class TvManager extends EventEmitter {
  private remote: AndroidRemote | null = null;
  private ime: ImeChannel | null = null;
  private currentHost: string | null = null;
  private currentName = "";
  private state: TvState | null = null;
  private imeTimers: Array<ReturnType<typeof setTimeout>> = [];

  get connectedHost(): string | null {
    return this.currentHost;
  }

  private emitMsg(msg: BridgeMessage): void {
    this.emit("message", msg);
  }

  async connect(host: string, port?: number, name?: string): Promise<void> {
    // Tear down any existing session before starting a new one.
    this.teardown();

    const saved = getDevice(host);
    this.currentHost = host;
    this.currentName = name || saved?.name || host;

    this.emitMsg({ type: "phase", phase: "connecting", host });

    const remote = new AndroidRemote(host, {
      name: "Relay",
      cert: saved?.cert ?? {},
      ...(port ? { remote_port: port } : {}),
    });
    this.remote = remote;

    remote.on("secret", () => {
      this.emitMsg({ type: "phase", phase: "pairing", host });
      this.emitMsg({ type: "pairingRequired", host });
    });

    remote.on("ready", () => {
      try {
        const cert = remote.getCertificate();
        saveDevice({ host, name: this.currentName, cert });
        touchDevice(host);
      } catch {
        /* certificate may be unavailable on some firmwares; non-fatal */
      }
      this.attachIme(remote);
      this.state = { host };
      this.emitMsg({ type: "paired", host });
      this.emitMsg({ type: "phase", phase: "connected", host });
      this.emitMsg({
        type: "connected",
        host,
        device: { host, name: this.currentName, paired: true, online: true },
      });
    });

    remote.on("powered", (powered: boolean) => {
      this.updateState({ powered });
    });

    remote.on("volume", (v: { level: number; maximum: number; muted: boolean }) => {
      this.updateState({
        volume: { level: v.level, maximum: v.maximum, muted: v.muted },
      });
    });

    remote.on("current_app", (app: string) => {
      this.updateState({ currentApp: app });
    });

    remote.on("error", (err: unknown) => {
      this.emitMsg({ type: "error", message: errText(err), code: "tv_error" });
    });

    remote.on("unpaired", () => {
      removeDevice(host);
      this.emitMsg({
        type: "error",
        message: "This TV unpaired Relay. Please pair again.",
        code: "unpaired",
      });
    });

    remote.on("close", () => {
      if (this.currentHost === host) {
        this.emitMsg({ type: "disconnected", host, reason: "connection closed" });
        this.emitMsg({ type: "phase", phase: "disconnected", host });
        this.teardown();
      }
    });

    try {
      await remote.start();
    } catch (err) {
      this.emitMsg({ type: "error", message: errText(err), code: "connect_failed" });
      this.emitMsg({ type: "phase", phase: "error", host });
      this.teardown();
    }
  }

  sendCode(code: string): void {
    if (!this.remote) {
      this.emitMsg({ type: "error", message: "No active pairing session", code: "no_session" });
      return;
    }
    try {
      this.remote.sendCode(code);
    } catch (err) {
      this.emitMsg({ type: "error", message: errText(err), code: "bad_code" });
    }
  }

  command(cmd: RemoteCommand): void {
    if (!this.remote || !this.currentHost) {
      this.emitMsg({ type: "error", message: "Not connected to a TV", code: "not_connected" });
      return;
    }
    const key = keyCodeFor(cmd);
    if (key === undefined) {
      this.emitMsg({ type: "error", message: `Unknown command: ${cmd}` });
      return;
    }
    // Any navigation can move focus or change the field (e.g. pressing a key on
    // the TV's on-screen keyboard), so our tracked field length is no longer
    // trustworthy — forget it so the next text clear can't over-delete.
    this.ime?.resetField();
    try {
      this.remote.sendKey(key, SHORT_PRESS);
    } catch (err) {
      this.emitMsg({ type: "error", message: errText(err), code: "send_failed" });
    }
  }

  /**
   * Set the focused field to exactly `text` (clears first, so re-sends replace
   * rather than duplicate). Deliberately does NOT press Enter: on TVs whose
   * on-screen keyboard has the focus, Enter activates the highlighted key (e.g.
   * adds an "a") instead of submitting. Search UIs filter live, so the text
   * landing is enough.
   */
  typeText(text: string): void {
    if (!this.remote || !this.currentHost) {
      this.emitMsg({ type: "error", message: "Not connected to a TV", code: "not_connected" });
      return;
    }
    const ime = this.ime;
    if (!ime) {
      this.emitMsg({ type: "error", message: "Text input isn't ready yet", code: "ime_unavailable" });
      return;
    }

    this.clearImeTimers();
    const fail = (err: unknown) =>
      this.emitMsg({ type: "error", message: errText(err), code: "send_failed" });

    try {
      ime.setText(""); // clear — the dependable primitive
    } catch (err) {
      fail(err);
      return;
    }

    // then type into the now-empty field
    this.imeTimers.push(
      setTimeout(() => {
        try {
          ime.setText(text);
        } catch (err) {
          fail(err);
        }
      }, 80),
    );
  }

  private clearImeTimers(): void {
    for (const t of this.imeTimers) clearTimeout(t);
    this.imeTimers = [];
  }

  /** Wire up the IME channel on the library's live socket, once connected. */
  private attachIme(remote: AndroidRemote): void {
    const socket = (remote as unknown as { remoteManager?: { client?: Socket } })
      .remoteManager?.client;
    if (!socket) return;
    this.ime?.detach();
    this.ime = new ImeChannel(socket);
    this.ime.on("field", (e: ImeFieldEvent) => {
      this.emitMsg({ type: "imeField", focused: e.focused, value: e.value });
    });
  }

  /** Press a named editing key (Enter / Backspace / Search). */
  pressNamed(key: NamedKey): void {
    if (!this.remote || !this.currentHost) {
      this.emitMsg({ type: "error", message: "Not connected to a TV", code: "not_connected" });
      return;
    }
    const code = keyCodeForNamed(key);
    if (code === undefined) {
      this.emitMsg({ type: "error", message: `Unknown key: ${key}` });
      return;
    }
    try {
      this.remote.sendKey(code, SHORT_PRESS);
    } catch (err) {
      this.emitMsg({ type: "error", message: errText(err), code: "send_failed" });
    }
  }

  disconnect(reason = "disconnected"): void {
    if (!this.remote) return;
    const host = this.currentHost ?? undefined;
    this.teardown();
    this.emitMsg({ type: "disconnected", host, reason });
    this.emitMsg({ type: "phase", phase: "disconnected", host });
  }

  private updateState(patch: Partial<TvState>): void {
    if (!this.currentHost) return;
    this.state = {
      ...(this.state ?? { host: this.currentHost }),
      ...patch,
      host: this.currentHost,
    };
    this.emitMsg({ type: "state", state: this.state });
  }

  private teardown(): void {
    this.clearImeTimers();
    if (this.ime) {
      this.ime.detach();
      this.ime.removeAllListeners();
      this.ime = null;
    }
    if (this.remote) {
      try {
        this.remote.stop();
      } catch {
        /* ignore */
      }
      this.remote.removeAllListeners();
    }
    this.remote = null;
    this.currentHost = null;
    this.state = null;
  }
}
