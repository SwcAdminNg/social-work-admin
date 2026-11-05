import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPasskeys } from "@/lib/api/passkeys";
import { PasskeysList } from "@/components/passkeys-admin/PasskeysList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Passkeys | Admin Panel",
  description: "Devices registered for fingerprint, face or screen-lock sign-in.",
};

export default async function PasskeysPage() {
  const session = await auth();
  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await getPasskeys(1, 20, session.accessToken).catch(() => ({
    items: [],
    meta: { page: 1, page_size: 20, total_items: 0, total_pages: 1, has_next: false, has_previous: false },
  }));

  return <PasskeysList initialData={initialData} />;
}
