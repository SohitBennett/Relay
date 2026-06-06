import { RemoteDirection } from "androidtv-remote";
import type { RemoteCommand } from "@relay/shared";

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
