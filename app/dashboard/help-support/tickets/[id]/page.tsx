"use client";

import { useParams } from "next/navigation";
import { TicketDetail } from "@/components/support-admin/TicketDetail";

export default function TicketDetailPage() {
  const params = useParams() as { id: string };
  return <TicketDetail ticketId={params.id} />;
}
