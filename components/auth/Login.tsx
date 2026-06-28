"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthPageShell } from "./shared/AuthPageShell";
import { FloatingInput } from "./shared/FloatingInput";
import { PasswordToggle } from "./shared/PasswordToggle";
import { IconArrowRight, IconCheck, IconLock, IconMail, IconSpinner } from "./shared/icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate async login
    setTimeout(() => setLoading(false), 1800);
  };

  return (
    <AuthPageShell>
      {/* Heading */}
      <div className="mb-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
          Welcome back
        </p>
        <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Sign in to your account
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          Continue your learning journey with Social Work Nigeria.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Email */}
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

        {/* Password */}
        <FloatingInput
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          icon={<IconLock />}
          autoComplete="current-password"
          required
          suffix={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          }
        />

        {/* Keep me logged in + Forgot password */}
        <div className="flex items-center justify-between pt-0.5">
          {/* Custom checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={keepLoggedIn}
              onClick={() => setKeepLoggedIn((v) => !v)}
              className={`
                w-[18px] h-[18px] flex-shrink-0 rounded-[5px] border-2 flex items-center justify-center
                transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] focus-visible:ring-offset-1
                ${
                  keepLoggedIn
                    ? "bg-[#2D6A4F] border-[#2D6A4F] dark:bg-[#2D6A4F] dark:border-[#2D6A4F]"
                    : "bg-white dark:bg-white/5 border-gray-300 dark:border-white/20 group-hover:border-[#2D6A4F] dark:group-hover:border-[#52b788]"
                }
              `}
            >
              {keepLoggedIn && <IconCheck />}
            </button>
            <span className="text-[0.83rem] text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-150">
              Keep me logged in
            </span>
          </label>

          <Link
            href="/forgot-password"
            className="text-[0.83rem] font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
          >
            Forgot password?
          </Link>
        </div>

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
              Signing in…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign in
              <IconArrowRight />
            </span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6" aria-hidden="true">
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/8" />
        <span className="text-[0.75rem] text-gray-400 dark:text-gray-600 font-medium">
          or
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/8" />
      </div>

      {/* Register link */}
      <p className="text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
        >
          Create an account
        </Link>
      </p>

      {/* Footer note */}
      <p className="mt-10 text-center text-[0.72rem] text-gray-400 dark:text-gray-600 leading-relaxed">
        By signing in, you agree to our{" "}
        <Link
          href="/terms-of-service"
          className="underline hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy-policy"
          className="underline hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </AuthPageShell>
  );
}
