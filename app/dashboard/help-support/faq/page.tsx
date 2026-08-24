import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFaqCategories, getFaqItems } from "@/lib/api/support";
import { FaqManager } from "@/components/support-admin/FaqManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FAQ Management | Admin Panel",
  description: "Manage the public help center FAQ categories and questions.",
};

export default async function FaqPage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const [categories, items] = await Promise.all([
    getFaqCategories(session.accessToken),
    getFaqItems({ page: 1, page_size: 100 }, session.accessToken),
  ]);

  return <FaqManager initialCategories={categories} initialItems={items} />;
}
