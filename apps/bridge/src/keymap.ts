import { RemoteDirection } from "androidtv-remote";
import type { RemoteCommand, NamedKey } from "@relay/shared";

/**
 * Android KeyEvent codes. The Android TV Remote protobuf `RemoteKeyCode` enum
 * mirrors these exact numeric values, so passing the raw number to `sendKey`
 * is safe and avoids depending on the library's enum member names.
 */
const KEY = {
  HOME: 3,
  BACK: 4,
  DPAD_UP: 19,
  DPAD_DOWN: 20,
  DPAD_LEFT: 21,
  DPAD_RIGHT: 22,
  DPAD_CENTER: 23,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  POWER: 26,
  VOLUME_MUTE: 164,
  // Text editing
  KEY_0: 7, // KEYCODE_0 .. KEYCODE_9 are 7..16
  KEY_A: 29, // KEYCODE_A .. KEYCODE_Z are 29..54
  SPACE: 62,
  ENTER: 66,
  DEL: 67, // backspace
  SEARCH: 84,
} as const;

const COMMAND_TO_KEY: Record<RemoteCommand, number> = {
  DPAD_UP: KEY.DPAD_UP,
  DPAD_DOWN: KEY.DPAD_DOWN,
  DPAD_LEFT: KEY.DPAD_LEFT,
  DPAD_RIGHT: KEY.DPAD_RIGHT,
  DPAD_CENTER: KEY.DPAD_CENTER,
  BACK: KEY.BACK,
  HOME: KEY.HOME,
  VOLUME_UP: KEY.VOLUME_UP,
  VOLUME_DOWN: KEY.VOLUME_DOWN,
  MUTE: KEY.VOLUME_MUTE,
  POWER: KEY.POWER,
};

/** RemoteDirection.SHORT (single tap). Falls back to the protobuf value 3. */
export const SHORT_PRESS: number =
  typeof RemoteDirection?.SHORT === "number" ? RemoteDirection.SHORT : 3;

export function keyCodeFor(command: RemoteCommand): number | undefined {
  return COMMAND_TO_KEY[command];
}

const NAMED_TO_KEY: Record<NamedKey, number> = {
  ENTER: KEY.ENTER,
  DEL: KEY.DEL,
  SEARCH: KEY.SEARCH,
};

export function keyCodeForNamed(key: NamedKey): number | undefined {
  return NAMED_TO_KEY[key];
}

/**
 * Translate a string into a sequence of Android key codes — the same events a
 * Bluetooth keyboard would emit. Phase A scope: lowercase letters, digits and
 * space (the protocol's single-key events carry no Shift/meta state, so
 * uppercase and symbols are intentionally dropped). Unmappable characters are
 * skipped so a paste of "Bob's TV" still types what it can.
 */
export function keyCodesForText(text: string): number[] {
  const codes: number[] = [];
  for (const ch of text.toLowerCase()) {
    if (ch >= "a" && ch <= "z") {
      codes.push(KEY.KEY_A + (ch.charCodeAt(0) - 97));
    } else if (ch >= "0" && ch <= "9") {
      codes.push(KEY.KEY_0 + (ch.charCodeAt(0) - 48));
    } else if (ch === " ") {
      codes.push(KEY.SPACE);
    }
    // other characters have no Shift-free key code — skip them
  }
  return codes;
}
