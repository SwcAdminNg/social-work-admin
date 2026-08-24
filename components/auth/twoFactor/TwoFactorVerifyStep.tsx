"use client";

import { useEffect, useState } from "react";
import { twoFactorLoginResend, twoFactorLoginVerify, type AuthSessionData, type TwoFactorMethod } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { CodeInput } from "./CodeInput";
import { IconArrowLeft, IconArrowRight, IconMail, IconRefresh, IconShieldCheck, IconSmartphone, IconSpinner } from "../shared/icons";

const RESEND_COOLDOWN_SECONDS = 30;

export function TwoFactorVerifyStep({
  challengeToken,
  method,
  onBack,
  onVerified,
}: {
  challengeToken: string;
  method: TwoFactorMethod;
  onBack: () => void;
  onVerified: (data: AuthSessionData) => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(method === "EMAIL" ? RESEND_COOLDOWN_SECONDS : 0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const submit = async (submittedCode: string) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await twoFactorLoginVerify(challengeToken, submittedCode);
      onVerified(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to verify code. Please try again.");
      setCode("");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await twoFactorLoginResend(challengeToken);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
      >
        <IconArrowLeft />
        Back
      </button>

      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center mb-4">
          {method === "TOTP" ? <IconSmartphone /> : <IconShieldCheck />}
        </div>
        <h1 className="text-[1.6rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Enter verification code
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          {method === "TOTP"
            ? "Open your authenticator app and enter the 6-digit code."
            : "We've sent a 6-digit code to your email address."}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3.5 py-2.5 text-[0.83rem] font-medium text-red-700 dark:text-red-400 mb-4"
        >
          {error}
        </p>
      )}

      <CodeInput value={code} onChange={setCode} onComplete={submit} disabled={loading} />

      <button
        type="button"
        onClick={() => code.length === 6 && submit(code)}
        disabled={loading || code.length !== 6}
        className="relative mt-6 w-full h-[52px] rounded-xl font-bold text-[0.93rem] text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] shadow-lg shadow-green-900/20 hover:shadow-green-900/30 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0 overflow-hidden"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2.5">
            <IconSpinner className="w-4 h-4 text-white/80" />
            Verifying…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Verify
            <IconArrowRight />
          </span>
        )}
      </button>

      {method === "EMAIL" && (
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
          className="mt-5 w-full inline-flex items-center justify-center gap-1.5 text-[0.83rem] font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
        >
          {resending ? <IconSpinner className="w-3.5 h-3.5" /> : <IconRefresh />}
          {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
        </button>
      )}

      {method === "EMAIL" && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[0.75rem] text-gray-400 dark:text-gray-600">
          <IconMail />
          Check your inbox and spam folder
        </div>
      )}
    </div>
  );
}
