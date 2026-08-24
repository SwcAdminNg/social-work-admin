"use client";

import { useEffect, useState } from "react";
import {
  emailSetupConfirm,
  emailSetupStart,
  totpSetupConfirm,
  totpSetupStart,
  type AuthSessionData,
  type TwoFactorMethod,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { CodeInput } from "./CodeInput";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconMail,
  IconRefresh,
  IconSmartphone,
  IconSpinner,
} from "../shared/icons";

type Choice = TwoFactorMethod | null;

export function TwoFactorSetupStep({
  challengeToken,
  onBack,
  onVerified,
}: {
  challengeToken: string;
  onBack: () => void;
  onVerified: (data: AuthSessionData) => void;
}) {
  const [choice, setChoice] = useState<Choice>(null);

  if (choice === "TOTP") {
    return <TotpSetup challengeToken={challengeToken} onBack={() => setChoice(null)} onVerified={onVerified} />;
  }

  if (choice === "EMAIL") {
    return <EmailSetup challengeToken={challengeToken} onBack={() => setChoice(null)} onVerified={onVerified} />;
  }

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
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
          Secure your account
        </p>
        <h1 className="text-[1.6rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Set up two-factor authentication
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          This is required to protect your account. Choose how you&apos;d like to receive codes.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <MethodCard
          icon={<IconSmartphone />}
          title="Authenticator app"
          badge="Recommended"
          description="Scan a QR code once. Your app generates a new code every 30 seconds — works offline."
          onSelect={() => setChoice("TOTP")}
        />
        <MethodCard
          icon={<IconMail />}
          title="Email"
          description="We'll send a 6-digit code to your email address each time you sign in."
          onSelect={() => setChoice("EMAIL")}
        />
      </div>
    </div>
  );
}

function MethodCard({
  icon,
  title,
  description,
  badge,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex items-start gap-4 text-left rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 transition-all duration-150 hover:border-[#2D6A4F] dark:hover:border-[#52b788] hover:shadow-[0_0_0_3px_rgba(45,106,79,0.1)] dark:hover:shadow-[0_0_0_3px_rgba(82,183,136,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788]"
    >
      <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center">
        {icon}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="font-bold text-[0.93rem] text-gray-900 dark:text-white">{title}</span>
          {badge && (
            <span className="text-[0.62rem] font-bold uppercase tracking-wide text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 rounded-full px-2 py-0.5">
              {badge}
            </span>
          )}
        </span>
        <span className="block mt-1 text-[0.8rem] text-gray-500 dark:text-gray-400 leading-relaxed">
          {description}
        </span>
      </span>
      <span className="mt-2 text-gray-300 dark:text-gray-600 group-hover:text-[#2D6A4F] dark:group-hover:text-[#52b788] transition-colors duration-150">
        <IconArrowRight />
      </span>
    </button>
  );
}

function TotpSetup({
  challengeToken,
  onBack,
  onVerified,
}: {
  challengeToken: string;
  onBack: () => void;
  onVerified: (data: AuthSessionData) => void;
}) {
  const [starting, setStarting] = useState(true);
  const [secret, setSecret] = useState("");
  const [qrCodeDataUri, setQrCodeDataUri] = useState("");
  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStarting(true);
    setError(null);
    totpSetupStart(challengeToken)
      .then(({ data }) => {
        if (cancelled) return;
        setSecret(data.secret);
        setQrCodeDataUri(data.qr_code_data_uri);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Unable to start authenticator setup.");
      })
      .finally(() => {
        if (!cancelled) setStarting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [challengeToken]);

  const submit = async (submittedCode: string) => {
    setError(null);
    setConfirming(true);
    try {
      const { data } = await totpSetupConfirm(challengeToken, submittedCode);
      onVerified(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Please try again.");
      setCode("");
      setConfirming(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access may be blocked; the key is still visible to copy manually.
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
        Choose a different method
      </button>

      <div className="mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center mb-4">
          <IconSmartphone />
        </div>
        <h1 className="text-[1.6rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Scan the QR code
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          Use Google Authenticator, Microsoft Authenticator, or any TOTP app to scan the code below.
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

      {starting ? (
        <div className="flex items-center justify-center h-[220px]">
          <IconSpinner className="w-6 h-6 text-[#2D6A4F] dark:text-[#52b788]" />
        </div>
      ) : (
        qrCodeDataUri && (
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeDataUri} alt="Scan this QR code with your authenticator app" width={180} height={180} />
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[0.75rem] text-gray-500 dark:text-gray-400 mb-1.5 text-center">
                Can&apos;t scan? Enter this key manually:
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3.5 py-2.5 font-mono text-[0.8rem] tracking-wide text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 transition-colors duration-150"
              >
                <span className="truncate">{secret}</span>
                <span className="flex-shrink-0 text-[0.72rem] font-sans font-semibold text-[#2D6A4F] dark:text-[#52b788] flex items-center gap-1">
                  {copied ? (
                    <>
                      <IconCheck /> Copied
                    </>
                  ) : (
                    "Copy"
                  )}
                </span>
              </button>
            </div>

            <p className="text-[0.8rem] font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
              Enter the 6-digit code from your app
            </p>
            <CodeInput value={code} onChange={setCode} onComplete={submit} disabled={confirming} />

            <button
              type="button"
              onClick={() => code.length === 6 && submit(code)}
              disabled={confirming || code.length !== 6}
              className="relative mt-6 w-full h-[52px] rounded-xl font-bold text-[0.93rem] text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] shadow-lg shadow-green-900/20 hover:shadow-green-900/30 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0 overflow-hidden"
            >
              {confirming ? (
                <span className="flex items-center justify-center gap-2.5">
                  <IconSpinner className="w-4 h-4 text-white/80" />
                  Confirming…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Confirm and finish
                  <IconArrowRight />
                </span>
              )}
            </button>
          </>
        )
      )}
    </div>
  );
}

function EmailSetup({
  challengeToken,
  onBack,
  onVerified,
}: {
  challengeToken: string;
  onBack: () => void;
  onVerified: (data: AuthSessionData) => void;
}) {
  const [starting, setStarting] = useState(true);
  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    setError(null);
    try {
      await emailSetupStart(challengeToken);
      setResendCooldown(30);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to send code. Please try again.");
    }
  };

  useEffect(() => {
    let cancelled = false;
    setStarting(true);
    emailSetupStart(challengeToken)
      .then(() => {
        if (!cancelled) setResendCooldown(30);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Unable to send code. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setStarting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [challengeToken]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const submit = async (submittedCode: string) => {
    setError(null);
    setConfirming(true);
    try {
      const { data } = await emailSetupConfirm(challengeToken, submittedCode);
      onVerified(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Please try again.");
      setCode("");
      setConfirming(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    await sendCode();
    setResending(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
      >
        <IconArrowLeft />
        Choose a different method
      </button>

      <div className="mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center mb-4">
          <IconMail />
        </div>
        <h1 className="text-[1.6rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Check your email
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          We&apos;ve sent a 6-digit code to your email address. Enter it below to finish setting up.
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

      {starting ? (
        <div className="flex items-center justify-center h-[80px]">
          <IconSpinner className="w-6 h-6 text-[#2D6A4F] dark:text-[#52b788]" />
        </div>
      ) : (
        <>
          <CodeInput value={code} onChange={setCode} onComplete={submit} disabled={confirming} />

          <button
            type="button"
            onClick={() => code.length === 6 && submit(code)}
            disabled={confirming || code.length !== 6}
            className="relative mt-6 w-full h-[52px] rounded-xl font-bold text-[0.93rem] text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] shadow-lg shadow-green-900/20 hover:shadow-green-900/30 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0 overflow-hidden"
          >
            {confirming ? (
              <span className="flex items-center justify-center gap-2.5">
                <IconSpinner className="w-4 h-4 text-white/80" />
                Confirming…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Confirm and finish
                <IconArrowRight />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="mt-5 w-full inline-flex items-center justify-center gap-1.5 text-[0.83rem] font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
          >
            {resending ? <IconSpinner className="w-3.5 h-3.5" /> : <IconRefresh />}
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
          </button>
        </>
      )}
    </div>
  );
}
