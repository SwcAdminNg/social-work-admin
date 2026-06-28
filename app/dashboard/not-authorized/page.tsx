import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconLock } from "@/components/dashboard/icons";

export default async function NotAuthorizedPage() {
  const session = await auth();

  if (session?.user?.userType === "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-4">
      <EmptyState
        icon={IconLock}
        title="You don't have permission to view this page"
        description="Course management is restricted to administrator accounts. If you believe this is a mistake, contact your system administrator."
      />
      <Link
        href="/dashboard"
        className="self-center text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] no-underline hover:text-[#1e4d38] dark:hover:text-white transition-colors duration-150"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
