"use client";

import { Toaster } from "sonner";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { SessionManager } from "@/components/auth/SessionManager";

function Content({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "lg:pl-[78px]" : "lg:pl-[252px]"
      }`}
    >
      <DashboardHeader />
      <main className="flex-1 bg-[#f7f7fb] p-4 sm:p-6 dark:bg-ink-page">
        {children}
      </main>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#f7f7fb] dark:bg-ink-page">
        <Sidebar />
        <Content>{children}</Content>
      </div>
      <Toaster position="top-right" richColors closeButton />
      <SessionManager />
    </SidebarProvider>
  );
}
