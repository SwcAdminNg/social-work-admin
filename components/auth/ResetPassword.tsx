"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthPageShell } from "./shared/AuthPageShell";
import { FloatingInput } from "./shared/FloatingInput";
import { PasswordToggle } from "./shared/PasswordToggle";
import { IconArrowRight, IconLock, IconSpinner } from "./shared/icons";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate resetting password
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 1800);
  };

  if (done) {
    return (
      <AuthPageShell>
        <div className="mb-8">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
            All set
          </p>
          <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
            Password reset
          </h1>
          <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
            Your password has been changed successfully. You can now sign in
            with your new password.
          </p>
        </div>

        <Link
          href="/login"
          className={`
            flex items-center justify-center gap-2 mt-2 w-full h-[52px] rounded-xl font-bold text-[0.93rem] text-white no-underline
            bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68]
            shadow-lg shadow-green-900/20 hover:shadow-green-900/30
            transition-all duration-200 hover:-translate-y-0.5
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2
          `}
        >
          Continue to sign in
          <IconArrowRight />
        </Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      {/* Heading */}
      <div className="mb-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
          Set new password
        </p>
        <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Reset your password
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FloatingInput
          id="password"
          label="New password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          icon={<IconLock />}
          autoComplete="new-password"
          required
          suffix={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          }
        />

        <FloatingInput
          id="confirmPassword"
          label="Confirm new password"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={setConfirmPassword}
          icon={<IconLock />}
          autoComplete="new-password"
          required
          suffix={
            <PasswordToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((v) => !v)}
            />
          }
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className={`
            relative mt-2 w-full h-[52px] rounded-xl font-bold text-[0.93rem] text-white
            bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68]
            shadow-lg shadow-green-900/20 hover:shadow-green-900/30
            transition-all duration-200 hover:-translate-y-0.5
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2
            disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0
            overflow-hidden
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2.5">
              <IconSpinner className="w-4 h-4 text-white/80" />
              Resetting…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Reset password
              <IconArrowRight />
            </span>
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
        <Link
          href="/login"
          className="font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
        >
          Back to sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
