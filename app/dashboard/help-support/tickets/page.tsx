import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTickets } from "@/lib/api/support";
import { TicketQueueList } from "@/components/support-admin/TicketQueueList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support Tickets | Admin Panel",
  description: "Manage the help & support ticket queue.",
};

export default async function TicketsPage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await getTickets({ page: 1, page_size: 20 }, session.accessToken);

  return <TicketQueueList initialData={initialData} currentAdminId={session.user.id} />;
}
