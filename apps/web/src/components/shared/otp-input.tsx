"use client";

import * as React from "react";

export interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  label?: string;
}

export function OtpInput({ length = 6, value, onChange, disabled, label = "Verification code" }: OtpInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  function handleInput(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && refs.current[index + 1]) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[index] && refs.current[index - 1]) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex gap-2 mb-5">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          maxLength={1}
          inputMode="numeric"
          disabled={disabled}
          aria-label={`${label}, digit ${i + 1} of ${length}`}
          className="w-[44px] h-[52px] border-[1.5px] border-[var(--line-2)] rounded-[10px] text-center font-mono font-semibold text-xl focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
        />
      ))}
    </div>
  );
}
