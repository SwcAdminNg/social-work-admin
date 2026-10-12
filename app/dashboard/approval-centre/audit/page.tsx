import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuditTrail } from "@/components/governance/AuditTrail";

export const dynamic = "force-dynamic";

export default async function AuditTrailPage() {
  const session = await auth();

  if (!session?.accessToken || (session.user.userType !== "ADMIN" && session.user.userType !== "INSTRUCTOR")) {
    redirect("/dashboard/not-authorized");
  }

  return <AuditTrail />;
}
