"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { tap } from "../lib/haptics";

interface KeyProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  onPress?: () => void;
  variant?: "default" | "danger";
  pressed?: boolean;
  children?: ReactNode;
}

/**
 * A physical key on the remote: layered depth, accent glow on press, and
 * haptic feedback on touch devices. Visual press state is handled in CSS
 * (`:active` / `data-pressed`) so it stays snappy.
 */
export const Key = forwardRef<HTMLButtonElement, KeyProps>(function Key(
  { onPress, variant = "default", pressed, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      data-pressed={pressed ? "true" : undefined}
      onPointerDown={() => tap()}
      onClick={() => onPress?.()}
      className={`key ${variant === "danger" ? "key--danger" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
