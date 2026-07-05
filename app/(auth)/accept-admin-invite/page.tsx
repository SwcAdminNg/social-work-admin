import AcceptAdminInvite from "@/components/auth/AcceptAdminInvite";
import { Suspense } from "react";

export default function AcceptAdminInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptAdminInvite />
    </Suspense>
  );
}
