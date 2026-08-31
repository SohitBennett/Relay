import { EventEmitter } from "node:events";
import type { Socket } from "node:net";
import protobuf from "protobufjs";

/**
 * Corrected Android TV Remote v2 IME schema.
 *
 * The `androidtv-remote` library ships an *incomplete* definition of the
 * text-edit messages (its `RemoteEditInfo` is missing the field that carries
 * the actual string), so it can only receive — never send — text. This is the
 * full schema, ported from tronikos/androidtvremote2 (the library Home
 * Assistant uses), restricted to the messages Relay needs. Unknown fields on
 * incoming messages are skipped by protobuf, so a partial RemoteMessage is fine.
 */
const PROTO = `
syntax = "proto3";
package remote;

message RemoteImeObject {
  int32 start = 1;
  int32 end = 2;
  string value = 3;
}
message RemoteEditInfo {
  int32 insert = 1;
  RemoteImeObject text_field_status = 2;
}
message RemoteImeBatchEdit {
  int32 ime_counter = 1;
  int32 field_counter = 2;
  repeated RemoteEditInfo edit_info = 3;
}
message RemoteTextFieldStatus {
  int32 counter_field = 1;
  string value = 2;
  int32 start = 3;
  int32 end = 4;
  int32 int5 = 5;
  string label = 6;
}
message RemoteImeShowRequest {
  RemoteTextFieldStatus remote_text_field_status = 2;
}
message RemoteAppInfo {
  int32 counter = 1;
  string app_package = 12;
}
message RemoteImeKeyInject {
  RemoteAppInfo app_info = 1;
  RemoteTextFieldStatus text_field_status = 2;
}
message RemoteMessage {
  RemoteImeKeyInject remote_ime_key_inject = 20;
  RemoteImeBatchEdit remote_ime_batch_edit = 21;
  RemoteImeShowRequest remote_ime_show_request = 22;
}
`;

const root = protobuf.parse(PROTO).root;
const RemoteMessage = root.lookupType("remote.RemoteMessage");

const DEBUG = process.env.RELAY_DEBUG_IME !== "0";
const log = (...args: unknown[]) => {
  if (DEBUG) console.log("[ime]", ...args);
};

/** Read a base-128 varint. Returns null if the buffer is too short. */
function readVarint(
  buf: Buffer,
  offset: number,
): { value: number; bytes: number } | null {
  let result = 0;
  let shift = 0;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos++];
    result |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) return { value: result >>> 0, bytes: pos - offset };
    shift += 7;
    if (shift > 35) return null; // malformed
  }
  return null;
}

export interface ImeFieldEvent {
  focused: boolean;
  value: string;
}

/**
 * Rides on the library's already-open TLS socket to add the text/IME channel:
 * tracks the counters the TV reports and sends `RemoteImeBatchEdit` to set the
 * focused field's value — exactly how the official Google TV remote types.
 *
 * Emits `"field"` ({@link ImeFieldEvent}) when the TV focuses a text field.
 */
export class ImeChannel extends EventEmitter {
  private socket: Socket;
  private acc: Buffer = Buffer.alloc(0);
  /** Mirrors the IME counter the TV reports (stays 0 if the TV never opens a session). */
  private imeCounter = 0;
  private fieldCounter = 0;
  /** Length of the text we last set, so we can replace it next time. */
  private lastLength = 0;
  /** The app the TV last reported focus in — used to detect context changes. */
  private currentApp = "";

  constructor(socket: Socket) {
    super();
    this.socket = socket;
    this.socket.on("data", this.onData);
    log("attached to TV socket");
  }

  detach(): void {
    this.socket.off("data", this.onData);
  }

  /**
   * Forget the tracked field length. Call when the field context changes (after
   * a submit/navigation or an app switch) so the next clear can't delete more
   * characters than the field actually holds — over-deletion is read by some
   * apps (e.g. YouTube) as Back presses, which navigates the user away.
   */
  resetField(): void {
    this.lastLength = 0;
  }

  /**
   * Replace the focused field's contents with `text` ("" clears it).
   * Selects the previously-set range [0, lastLength] so re-sends replace rather
   * than append.
   */
  setText(text: string): void {
    const payload = {
      remoteImeBatchEdit: {
        imeCounter: this.imeCounter,
        fieldCounter: this.fieldCounter,
        editInfo: [
          {
            insert: 1,
            textFieldStatus: { start: 0, end: this.lastLength, value: text },
          },
        ],
      },
    };
    const err = RemoteMessage.verify(payload);
    if (err) throw new Error(err);
    log(
      `setText -> imeCounter=${this.imeCounter} fieldCounter=${this.fieldCounter} ` +
        `replaceRange=[0,${this.lastLength}] value=${JSON.stringify(text)}`,
    );
    const buf = RemoteMessage.encodeDelimited(RemoteMessage.create(payload)).finish();
    this.socket.write(Buffer.from(buf));
    this.lastLength = text.length;
  }

  private onData = (data: Buffer): void => {
    this.acc = Buffer.concat([this.acc, data]);
    let offset = 0;
    while (offset < this.acc.length) {
      const len = readVarint(this.acc, offset);
      if (!len) break; // incomplete length prefix
      const start = offset + len.bytes;
      const end = start + len.value;
      if (this.acc.length < end) break; // incomplete payload
      this.handlePayload(this.acc.subarray(start, end));
      offset = end;
    }
    this.acc = this.acc.subarray(offset);
  };

  private handlePayload(payload: Buffer): void {
    let msg: Record<string, any>;
    try {
      msg = RemoteMessage.decode(payload) as unknown as Record<string, any>;
    } catch {
      return; // not a message we model — ignore
    }

    // Keep our sequence at or ahead of the counters the TV reports.
    if (msg.remoteImeBatchEdit) {
      const be = msg.remoteImeBatchEdit;
      if (typeof be.imeCounter === "number") this.imeCounter = be.imeCounter;
      if (typeof be.fieldCounter === "number") this.fieldCounter = be.fieldCounter;
      log(`<- batchEdit imeCounter=${be.imeCounter} fieldCounter=${be.fieldCounter}`);
    }

    // A text field gained focus via a show request.
    if (msg.remoteImeShowRequest) {
      const status = msg.remoteImeShowRequest.remoteTextFieldStatus;
      this.onFieldStatus("showRequest", status);
    }

    // Some TVs report the focused field inside the key-inject message instead.
    if (msg.remoteImeKeyInject) {
      const ki = msg.remoteImeKeyInject;
      const app: string = ki.appInfo?.appPackage ?? "";
      log(
        `<- keyInject app=${app} appCounter=${ki.appInfo?.counter} ` +
          `hasField=${Boolean(ki.textFieldStatus)}`,
      );
      // A different app gained focus — the previous field is gone, so any
      // length we were tracking is stale.
      if (app && app !== this.currentApp) {
        this.currentApp = app;
        this.resetField();
      }
      if (ki.textFieldStatus) this.onFieldStatus("keyInject", ki.textFieldStatus);
    }
  }

  private onFieldStatus(source: string, status: any): void {
    if (!status) return;
    const value: string = status.value ?? "";
    // Seed the field counter from the TV's reported field counter — helps TVs
    // that focus a field without first sending a batch edit.
    if (typeof status.counterField === "number") {
      this.fieldCounter = status.counterField;
    }
    this.lastLength = value.length;
    log(
      `<- ${source} field focused: counterField=${status.counterField} ` +
        `value=${JSON.stringify(value)}`,
    );
    this.emit("field", { focused: true, value } satisfies ImeFieldEvent);
  }
}
