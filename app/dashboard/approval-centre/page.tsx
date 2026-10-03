import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ApprovalCentre } from "@/components/governance/ApprovalCentre";

export const dynamic = "force-dynamic";

export default async function ApprovalCentrePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const session = await auth();

  if (!session?.accessToken || (session.user.userType !== "ADMIN" && session.user.userType !== "INSTRUCTOR")) {
    redirect("/dashboard/not-authorized");
  }

  const { view } = await searchParams;

  return <ApprovalCentre initialView={typeof view === "string" ? view : undefined} />;
}
