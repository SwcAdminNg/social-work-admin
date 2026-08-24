"use client";

import { useEffect, useRef } from "react";

const LENGTH = 6;

export function CodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDigitAt = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    const joined = next.join("");
    onChange(joined);
    if (joined.length === LENGTH && !joined.includes("")) {
      onComplete?.(joined);
    }
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigitAt(index, "");
      return;
    }

    if (cleaned.length > 1) {
      // Fast-typed or pasted multiple digits into one box.
      const chars = cleaned.split("");
      const next = digits.slice();
      let cursor = index;
      for (const ch of chars) {
        if (cursor >= LENGTH) break;
        next[cursor] = ch;
        cursor += 1;
      }
      const joined = next.join("");
      onChange(joined);
      const focusIndex = Math.min(cursor, LENGTH - 1);
      inputsRef.current[focusIndex]?.focus();
      if (joined.length === LENGTH && !joined.includes("")) {
        onComplete?.(joined);
      }
      return;
    }

    setDigitAt(index, cleaned);
    if (index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    handleChange(index, pasted);
  };

  return (
    <div className="flex items-center justify-between gap-2" role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full h-[58px] rounded-xl border bg-white dark:bg-white/5 text-center text-[1.4rem] font-bold text-gray-900 dark:text-white outline-none transition-all duration-150 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-[#2D6A4F] dark:focus:border-[#52b788] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.12)] dark:focus:shadow-[0_0_0_3px_rgba(82,183,136,0.12)] disabled:opacity-60"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
