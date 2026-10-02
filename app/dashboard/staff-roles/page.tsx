import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StaffRolesManager } from "@/components/governance/StaffRolesManager";

export const dynamic = "force-dynamic";

export default async function StaffRolesPage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  return <StaffRolesManager />;
}
