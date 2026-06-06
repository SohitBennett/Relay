"use client";

import type { RemoteCommand } from "@relay/shared";
import { Key } from "./Key";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "./icons";

interface DPadProps {
  onCommand: (command: RemoteCommand) => void;
  pressed?: RemoteCommand | null;
}

export function DPad({ onCommand, pressed }: DPadProps) {
  return (
    <div className="dial relative grid place-items-center p-3">
      <div className="grid grid-cols-3 grid-rows-3 gap-2.5 w-[15rem] h-[15rem] sm:w-[16.5rem] sm:h-[16.5rem]">
        {/* row 1 */}
        <span />
        <Key
          aria-label="Up"
          pressed={pressed === "DPAD_UP"}
          onPress={() => onCommand("DPAD_UP")}
          className="w-full h-full"
        >
          <ChevronUp width={26} height={26} />
        </Key>
        <span />

        {/* row 2 */}
        <Key
          aria-label="Left"
          pressed={pressed === "DPAD_LEFT"}
          onPress={() => onCommand("DPAD_LEFT")}
          className="w-full h-full"
        >
          <ChevronLeft width={26} height={26} />
        </Key>

        <Key
          aria-label="OK"
          pressed={pressed === "DPAD_CENTER"}
          onPress={() => onCommand("DPAD_CENTER")}
          className="ok-core w-full h-full text-[0.95rem] font-bold tracking-wide"
        >
          OK
        </Key>

        <Key
          aria-label="Right"
          pressed={pressed === "DPAD_RIGHT"}
          onPress={() => onCommand("DPAD_RIGHT")}
          className="w-full h-full"
        >
          <ChevronRight width={26} height={26} />
        </Key>

        {/* row 3 */}
        <span />
        <Key
          aria-label="Down"
          pressed={pressed === "DPAD_DOWN"}
          onPress={() => onCommand("DPAD_DOWN")}
          className="w-full h-full"
        >
          <ChevronDown width={26} height={26} />
        </Key>
        <span />
      </div>
    </div>
  );
}
