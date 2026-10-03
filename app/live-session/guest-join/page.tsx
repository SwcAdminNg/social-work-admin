import { Suspense } from "react";
import { GuestJoin } from "@/components/live-session/GuestJoin";

export const metadata = {
  title: "Join Live Session | Social Work Consultancy",
};

export default function GuestJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-ink-page" />}>
      <GuestJoin />
    </Suspense>
  );
}
