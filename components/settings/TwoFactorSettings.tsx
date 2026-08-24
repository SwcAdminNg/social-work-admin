"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTwoFactorStatus,
  switchToEmailConfirm,
  switchToEmailStart,
  switchToTotpConfirm,
  switchToTotpStart,
  type TwoFactorMethod,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { CodeInput } from "@/components/auth/twoFactor/CodeInput";
import { IconCheck, IconMail, IconRefresh, IconShieldCheck, IconSmartphone, IconSpinner } from "@/components/auth/shared/icons";
import { IconAlertTriangle } from "@/components/dashboard/icons";

type PendingSetup =
  | { method: "EMAIL" }
  | { method: "TOTP"; secret: string; qrCodeDataUri: string };

export function TwoFactorSettings() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingSetup | null>(null);
  const [confirmMethod, setConfirmMethod] = useState<TwoFactorMethod | null>(null);
  const [starting, setStarting] = useState<TwoFactorMethod | null>(null);
  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ["twoFactorStatus"],
    queryFn: () => getTwoFactorStatus(),
  });

  const status = data?.data;

  const resetPending = () => {
    setPending(null);
    setCode("");
    setError(null);
  };

  const startSwitch = async (method: TwoFactorMethod) => {
    setError(null);
    setSuccess(null);
    setStarting(method);
    try {
      if (method === "TOTP") {
        const { data } = await switchToTotpStart();
        setPending({ method: "TOTP", secret: data.secret, qrCodeDataUri: data.qr_code_data_uri });
      } else {
        await switchToEmailStart();
        setPending({ method: "EMAIL" });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to start setup. Please try again.");
    } finally {
      setStarting(null);
    }
  };

  const submitCode = async (submittedCode: string) => {
    if (!pending) return;
    setError(null);
    setConfirming(true);
    try {
      const { data } =
        pending.method === "TOTP"
          ? await switchToTotpConfirm(submittedCode)
          : await switchToEmailConfirm(submittedCode);

      queryClient.setQueryData(["twoFactorStatus"], { success: true, message: "", data });
      setSuccess(
        `Two-factor authentication is now set to ${data.two_factor_method === "TOTP" ? "authenticator app" : "email"}.`,
      );
      resetPending();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Please try again.");
      setCode("");
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirmSwitch = () => {
    if (!confirmMethod) return;
    const method = confirmMethod;
    setConfirmMethod(null);
    startSwitch(method);
  };

  const handleResendEmail = async () => {
    setResending(true);
    setError(null);
    try {
      await switchToEmailStart();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
      <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/80">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-9 h-9 rounded-xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center flex-shrink-0">
            <IconShieldCheck className="w-5 h-5" />
          </span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Required on every account. Choose how you receive your sign-in codes.
        </p>
      </div>

      <div className="p-8 space-y-6">
        {success && (
          <div className="p-4 rounded-2xl text-sm font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}
        {error && (
          <div className="p-4 rounded-2xl text-sm font-medium bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D6A4F]"></div>
          </div>
        )}

        {queryError && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400 text-sm">
            Error loading two-factor status: {(queryError as any).message}
          </div>
        )}

        {status && !pending && (
          <div className="space-y-3">
            <MethodRow
              icon={<IconSmartphone />}
              title="Authenticator app"
              description="Codes generated by an app on your device. Works offline."
              active={status.two_factor_method === "TOTP"}
              loading={starting === "TOTP"}
              switchDisabled={starting !== null}
              onSelect={() => setConfirmMethod("TOTP")}
            />
            <MethodRow
              icon={<IconMail />}
              title="Email"
              description="Codes sent to your inbox each time you sign in."
              active={status.two_factor_method === "EMAIL"}
              loading={starting === "EMAIL"}
              switchDisabled={starting !== null}
              onSelect={() => setConfirmMethod("EMAIL")}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
              Two-factor authentication protects your account and cannot be turned off.
            </p>
          </div>
        )}

        {pending && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {pending.method === "TOTP" ? "Scan the QR code" : "Enter the code we emailed you"}
              </h3>
              <button
                type="button"
                onClick={resetPending}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788]"
              >
                Cancel
              </button>
            </div>

            {pending.method === "TOTP" && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pending.qrCodeDataUri} alt="Scan this QR code with your authenticator app" width={160} height={160} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 text-center">
                  Can&apos;t scan? Enter this key manually:
                </p>
                <p className="text-center font-mono text-xs tracking-wide text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 rounded-xl px-3 py-2.5 mb-5 break-all">
                  {pending.secret}
                </p>
              </>
            )}

            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
              Enter the 6-digit code
            </p>
            <CodeInput value={code} onChange={setCode} onComplete={submitCode} disabled={confirming} />

            <button
              type="button"
              onClick={() => code.length === 6 && submitCode(code)}
              disabled={confirming || code.length !== 6}
              className="mt-5 w-full h-[48px] rounded-2xl font-bold text-sm text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {confirming ? <IconSpinner className="w-4 h-4" /> : <IconCheck />}
              {confirming ? "Confirming…" : "Confirm"}
            </button>

            {pending.method === "EMAIL" && (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resending}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white disabled:opacity-50"
              >
                {resending ? <IconSpinner className="w-3.5 h-3.5" /> : <IconRefresh />}
                Resend code
              </button>
            )}
          </div>
        )}
      </div>

      {confirmMethod && (
        <ConfirmSwitchModal
          method={confirmMethod}
          onCancel={() => setConfirmMethod(null)}
          onConfirm={handleConfirmSwitch}
        />
      )}
    </div>
  );
}

function ConfirmSwitchModal({
  method,
  onCancel,
  onConfirm,
}: {
  method: TwoFactorMethod;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const methodLabel = method === "TOTP" ? "Authenticator app" : "Email";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-switch-title"
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
          <IconAlertTriangle className="w-8 h-8" />
        </div>

        <h2 id="confirm-switch-title" className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Switch to {methodLabel}?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Your current two-factor method will stop working as soon as you finish setting up {methodLabel.toLowerCase()}.
          You&apos;ll need to verify with it the next time you sign in.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl shadow-lg shadow-green-900/20 transition-all hover:-translate-y-0.5"
          >
            Yes, continue
          </button>
        </div>
      </div>
    </div>
  );
}

function MethodRow({
  icon,
  title,
  description,
  active,
  loading,
  switchDisabled,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  loading: boolean;
  switchDisabled: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
        active
          ? "border-[#2D6A4F] dark:border-[#52b788] bg-[#2D6A4F]/5 dark:bg-[#52b788]/5"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <span
        className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${
          active
            ? "bg-[#2D6A4F] text-white"
            : "bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400"
        }`}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-gray-900 dark:text-white">{title}</p>
          {active && (
            <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 rounded-full px-2 py-0.5">
              <IconCheck /> Active
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>

      {active ? (
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="This is your current sign-in method"
          className="flex-shrink-0 px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700 rounded-xl cursor-not-allowed opacity-70"
        >
          Currently in use
        </button>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          disabled={switchDisabled}
          className="flex-shrink-0 px-4 py-2 text-xs font-bold text-[#2D6A4F] dark:text-[#52b788] border border-[#2D6A4F] dark:border-[#52b788] rounded-xl hover:bg-[#2D6A4F] hover:text-white dark:hover:bg-[#52b788] dark:hover:text-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#2D6A4F] dark:disabled:hover:text-[#52b788] flex items-center gap-1.5"
        >
          {loading && <IconSpinner className="w-3.5 h-3.5" />}
          Switch
        </button>
      )}
    </div>
  );
}
