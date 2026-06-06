/**
 * Ambient declaration for `androidtv-remote` covering the surface Relay uses.
 * Kept local so the bridge compiles deterministically even if the upstream
 * package ships no/incomplete types.
 */
declare module "androidtv-remote" {
  import { EventEmitter } from "node:events";

  export interface Certificate {
    key?: string;
    cert?: string;
  }

  export interface AndroidRemoteOptions {
    pairing_port?: number;
    remote_port?: number;
    name?: string;
    cert?: Certificate;
  }

  export interface VolumePayload {
    level: number;
    maximum: number;
    muted: boolean;
  }

  export class AndroidRemote extends EventEmitter {
    constructor(host: string, options?: AndroidRemoteOptions);
    /** Resolves true if already paired (no code needed), false if pairing started. */
    start(): Promise<boolean>;
    sendCode(code: string): void;
    sendKey(keyCode: number, direction: number): void;
    sendAppLink(url: string): void;
    getCertificate(): Certificate;
    stop(): void;
  }

  export const RemoteKeyCode: Record<string, number>;
  export const RemoteDirection: Record<string, number>;
}
