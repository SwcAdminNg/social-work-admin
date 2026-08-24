import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTickets } from "@/lib/api/support";
import { ApiError } from "@/lib/api/client";
import { TicketQueueList } from "@/components/support-admin/TicketQueueList";
import { NotStaffNotice } from "@/components/support-admin/NotStaffNotice";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support Tickets | Admin Panel",
  description: "Manage the help & support ticket queue.",
};

export default async function TicketsPage() {
  const session = await auth();

  if (!session?.accessToken || (session.user.userType !== "ADMIN" && session.user.userType !== "INSTRUCTOR")) {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await fetchInitialTickets(session.accessToken);
  if (initialData === "not-staff") {
    return <NotStaffNotice />;
  }

  return (
    <TicketQueueList
      initialData={initialData}
      currentUserId={session.user.id}
      isAdmin={session.user.userType === "ADMIN"}
    />
  );
}

async function fetchInitialTickets(token: string) {
  try {
    return await getTickets({ page: 1, page_size: 20 }, token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return "not-staff" as const;
    }
    throw error;
  }
}
