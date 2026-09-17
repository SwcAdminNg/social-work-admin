"use client";

import { useParams } from "next/navigation";
import { ApplicationDetail } from "@/components/instructor-applications/ApplicationDetail";

export default function InstructorApplicationDetailPage() {
  const params = useParams() as { id: string };
  return <ApplicationDetail applicationId={params.id} />;
}
