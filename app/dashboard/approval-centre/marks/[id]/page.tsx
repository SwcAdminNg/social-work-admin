import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EssayMarkReview } from "@/components/governance/EssayMarkReview";

export const dynamic = "force-dynamic";

export default async function EssayMarkReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.accessToken || (session.user.userType !== "ADMIN" && session.user.userType !== "INSTRUCTOR")) {
    redirect("/dashboard/not-authorized");
  }

  return <EssayMarkReview markId={id} />;
}
