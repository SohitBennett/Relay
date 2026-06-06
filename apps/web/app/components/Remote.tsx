"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RemoteCommand } from "@relay/shared";
import { useRelay } from "../lib/store";
import { StatusBar } from "./StatusBar";
import { DPad } from "./DPad";
import { Key } from "./Key";
import {
  BackIcon,
  HomeIcon,
  PowerIcon,
  VolumeUp,
  VolumeDown,
  VolumeMute,
} from "./icons";

const KEY_MAP: Record<string, RemoteCommand> = {
  ArrowUp: "DPAD_UP",
  ArrowDown: "DPAD_DOWN",
  ArrowLeft: "DPAD_LEFT",
  ArrowRight: "DPAD_RIGHT",
  Enter: "DPAD_CENTER",
  " ": "DPAD_CENTER",
  Backspace: "BACK",
  Escape: "BACK",
  h: "HOME",
  H: "HOME",
  m: "MUTE",
  M: "MUTE",
  "+": "VOLUME_UP",
  "=": "VOLUME_UP",
  "-": "VOLUME_DOWN",
  _: "VOLUME_DOWN",
};

export function Remote() {
  const { bridgeStatus, phase, connectedDevice, command, disconnectTv } = useRelay();
  const [pressed, setPressed] = useState<RemoteCommand | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = useCallback(
    (cmd: RemoteCommand) => {
      command(cmd);
      setPressed(cmd);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setPressed(null), 160);
    },
    [command],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const cmd = KEY_MAP[e.key];
      if (!cmd) return;
      e.preventDefault();
      fire(cmd);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fire]);

  return (
    <div className="mx-auto flex w-full max-w-[24rem] flex-col gap-5">
      <StatusBar
        bridgeStatus={bridgeStatus}
        phase={phase}
        device={connectedDevice}
        onDisconnect={disconnectTv}
      />

      <div className="slab flex flex-col items-center gap-7 px-6 py-8 sm:px-8">
        {/* Power — top right */}
        <div className="flex w-full items-center justify-between">
          <span className="eyebrow">remote</span>
          <Key
            aria-label="Power"
            variant="danger"
            pressed={pressed === "POWER"}
            onPress={() => fire("POWER")}
            className="h-11 w-11"
          >
            <PowerIcon width={20} height={20} />
          </Key>
        </div>

        {/* D-pad */}
        <DPad onCommand={fire} pressed={pressed} />

        {/* Back / Home */}
        <div className="flex w-full items-center justify-center gap-5">
          <Key
            aria-label="Back"
            pressed={pressed === "BACK"}
            onPress={() => fire("BACK")}
            className="h-14 w-14"
          >
            <BackIcon width={22} height={22} />
          </Key>
          <Key
            aria-label="Home"
            pressed={pressed === "HOME"}
            onPress={() => fire("HOME")}
            className="h-14 w-14"
          >
            <HomeIcon width={22} height={22} />
          </Key>
        </div>

        {/* Volume rocker */}
        <div className="surface flex w-full items-center justify-between gap-2 p-2">
          <Key
            aria-label="Volume down"
            pressed={pressed === "VOLUME_DOWN"}
            onPress={() => fire("VOLUME_DOWN")}
            className="h-12 flex-1"
          >
            <VolumeDown width={22} height={22} />
          </Key>
          <Key
            aria-label="Mute"
            pressed={pressed === "MUTE"}
            onPress={() => fire("MUTE")}
            className="h-12 w-14"
          >
            <VolumeMute width={22} height={22} />
          </Key>
          <Key
            aria-label="Volume up"
            pressed={pressed === "VOLUME_UP"}
            onPress={() => fire("VOLUME_UP")}
            className="h-12 flex-1"
          >
            <VolumeUp width={22} height={22} />
          </Key>
        </div>

        <p className="eyebrow text-center opacity-70">
          arrow keys · enter · backspace supported
        </p>
      </div>
    </div>
  );
}
