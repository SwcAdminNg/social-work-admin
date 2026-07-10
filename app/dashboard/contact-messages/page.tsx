import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getContactMessages } from "@/lib/api/contact";
import { ContactMessagesList } from "@/components/contact-admin/ContactMessagesList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Messages | Admin Panel",
  description: "View and manage incoming contact us messages.",
};

export default async function ContactMessagesPage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await getContactMessages(1, 20, session.accessToken);

  return <ContactMessagesList initialData={initialData} />;
}
