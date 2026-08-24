"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginRequest, type AuthSessionData, type TwoFactorMethod } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { AuthPageShell } from "./shared/AuthPageShell";
import { FloatingInput } from "./shared/FloatingInput";
import { PasswordToggle } from "./shared/PasswordToggle";
import { IconArrowRight, IconCheck, IconLock, IconMail, IconSpinner } from "./shared/icons";
import { TwoFactorVerifyStep } from "./twoFactor/TwoFactorVerifyStep";
import { TwoFactorSetupStep } from "./twoFactor/TwoFactorSetupStep";

type Step =
  | { kind: "credentials" }
  | { kind: "verify"; challengeToken: string; method: TwoFactorMethod }
  | { kind: "setup"; challengeToken: string };

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>({ kind: "credentials" });

  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const completeSignIn = async (data: AuthSessionData) => {
    const result = await signIn("credentials", {
      verifiedSession: JSON.stringify(data),
      keepLoggedIn: keepLoggedIn ? "true" : "false",
      redirect: false,
    });

    if (result?.error) {
      setError("Something went wrong finishing sign in. Please try again.");
      setStep({ kind: "credentials" });
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      identifierRef.current?.focus();
      return;
    }
    if (!password) {
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const { data } = await loginRequest({
        identifier,
        password,
        keep_logged_in: keepLoggedIn,
      });

      if (data.status === "two_factor_setup_required") {
        setStep({ kind: "setup", challengeToken: data.challenge.challenge_token });
      } else {
        setStep({
          kind: "verify",
          challengeToken: data.challenge.challenge_token,
          method: data.challenge.method ?? "EMAIL",
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid username/email or password.");
    } finally {
      setLoading(false);
    }
  };

  const backToCredentials = () => {
    setError(null);
    setStep({ kind: "credentials" });
  };

  return (
    <AuthPageShell>
      {step.kind === "verify" && (
        <TwoFactorVerifyStep
          challengeToken={step.challengeToken}
          method={step.method}
          onBack={backToCredentials}
          onVerified={completeSignIn}
        />
      )}

      {step.kind === "setup" && (
        <TwoFactorSetupStep
          challengeToken={step.challengeToken}
          onBack={backToCredentials}
          onVerified={completeSignIn}
        />
      )}

      {step.kind === "credentials" && (
        <>
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
            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3.5 py-2.5 text-[0.83rem] font-medium text-red-700 dark:text-red-400"
              >
                {error}
              </p>
            )}

            {/* Identifier */}
            <FloatingInput
              ref={identifierRef}
              id="identifier"
              label="Username or email"
              type="text"
              value={identifier}
              onChange={setIdentifier}
              icon={<IconMail />}
              autoComplete="username"
              required
            />

            {/* Password */}
            <FloatingInput
              ref={passwordRef}
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
        </>
      )}
    </AuthPageShell>
  );
}
