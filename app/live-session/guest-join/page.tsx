import { Suspense } from "react";
import { GuestJoin } from "@/components/live-session/GuestJoin";

export const metadata = {
  title: "Join Live Session | Social Work Consultancy",
};

export default function GuestJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <GuestJoin />
    </Suspense>
  );
}
