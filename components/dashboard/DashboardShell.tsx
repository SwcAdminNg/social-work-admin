"use client";

import { SidebarProvider, useSidebar } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";

function Content({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "lg:pl-[84px]" : "lg:pl-72"
      }`}
    >
      <DashboardHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-black/20">
        {children}
      </main>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="bg-gray-50 dark:bg-black/20 min-h-screen">
        <Sidebar />
        <Content>{children}</Content>
      </div>
    </SidebarProvider>
  );
}
