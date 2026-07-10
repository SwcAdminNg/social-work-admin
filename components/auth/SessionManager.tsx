"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { IconAlertTriangle, IconSpinner } from "@/components/dashboard/icons";

export function SessionManager() {
  const { data: session, update } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check if session has expired or is about to expire (within 5 seconds)
    // Or if the NextAuth session explicitly sets error to SessionExpired
    const checkSession = () => {
      if (!session?.accessTokenExpires) return;

      if (
        session.error === "SessionExpired" ||
        Date.now() >= session.accessTokenExpires - 5000
      ) {
        if (!showModal) setShowModal(true);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 10000); // check every 10 seconds

    return () => clearInterval(interval);
  }, [session, showModal]);

  const handleRefresh = async () => {
    if (!session?.refreshToken) {
      toast.error("No refresh token available. Logging out...");
      signOut({ callbackUrl: "/login" });
      return;
    }

    setIsRefreshing(true);
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        await update({
          accessToken: data.data.access_token,
          refreshToken: data.data.refresh_token,
          accessTokenExpires: Date.now() + data.data.expires_in * 1000,
        });
        setShowModal(false);
        toast.success("Session continued successfully!");
      } else {
        throw new Error(data.message || "Failed to refresh");
      }
    } catch (error: any) {
      toast.error(error.message || "Session expired completely. Logging out...");
      signOut({ callbackUrl: "/login" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6">
          <IconAlertTriangle className="w-8 h-8" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Your Session is Expiring
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          For your security, your session has expired. Would you like to continue and extend your session?
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isRefreshing}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
          >
            No, log me out
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl shadow-lg shadow-green-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isRefreshing && <IconSpinner className="w-4 h-4" />}
            Yes, continue
          </button>
        </div>
      </div>
    </div>
  );
}
