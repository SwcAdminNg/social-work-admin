"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthPageShell } from "./shared/AuthPageShell";
import { FloatingInput } from "./shared/FloatingInput";
import { IconArrowRight, IconMail, IconSpinner } from "./shared/icons";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending reset link
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1800);
  };

  if (sent) {
    return (
      <AuthPageShell>
        <div className="mb-8">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
            Check your inbox
          </p>
          <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
            Reset link sent
          </h1>
          <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
            We've sent a password reset link to{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {email}
            </span>
            . Follow the link in the email to choose a new password.
          </p>
        </div>

        <p className="text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
          Didn't get the email?{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
          >
            Try again
          </button>
        </p>

        <p className="mt-10 text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
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

  return (
    <AuthPageShell>
      {/* Heading */}
      <div className="mb-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
          Forgot password
        </p>
        <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Forgot your password?
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          Enter the email associated with your account and we'll send you a
          link to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FloatingInput
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          icon={<IconMail />}
          autoComplete="email"
          required
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
              Sending link…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Send reset link
              <IconArrowRight />
            </span>
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
        >
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
