"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptAdminInvite } from "@/lib/api/users";
import { AuthPageShell } from "./shared/AuthPageShell";
import { FloatingInput } from "./shared/FloatingInput";
import { PasswordToggle } from "./shared/PasswordToggle";
import { IconArrowRight, IconLock, IconSpinner } from "./shared/icons";

export default function AcceptAdminInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError("Invalid or missing invitation token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      passwordRef.current?.focus();
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      confirmPasswordRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await acceptAdminInvite({
        token,
        password,
        confirm_password: confirmPassword,
      });

      setSuccessMessage(response.data.message || "Invite accepted successfully");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to accept invite. The link may have expired.");
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      {/* Heading */}
      <div className="mb-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
          Admin Setup
        </p>
        <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Accept your invitation
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          Create a strong password to activate your admin account.
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

        {/* Success message */}
        {successMessage && (
          <p
            role="alert"
            className="rounded-lg bg-green-50 dark:bg-[#52b788]/10 px-3.5 py-2.5 text-[0.83rem] font-medium text-[#2D6A4F] dark:text-[#52b788]"
          >
            {successMessage} Redirecting to login...
          </p>
        )}

        {/* Password */}
        <FloatingInput
          ref={passwordRef}
          id="password"
          label="Password"
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

        {/* Confirm Password */}
        <FloatingInput
          ref={confirmPasswordRef}
          id="confirmPassword"
          label="Confirm Password"
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
          disabled={loading || !!successMessage || !token}
          className={`
            relative mt-4 w-full h-[52px] rounded-xl font-bold text-[0.93rem] text-white
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
              Activating…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Activate Account
              <IconArrowRight />
            </span>
          )}
        </button>
      </form>
    </AuthPageShell>
  );
}
