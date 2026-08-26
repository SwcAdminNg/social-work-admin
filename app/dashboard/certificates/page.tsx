import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listCertificateTemplates } from "@/lib/api/certificates";
import { TemplateList } from "@/components/certificates-admin/TemplateList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Certificates | Admin Panel",
  description: "Design certificate templates and assign them to courses.",
};

export default async function CertificatesPage() {
  const session = await auth();

  if (!session?.accessToken || (session.user.userType !== "ADMIN" && session.user.userType !== "INSTRUCTOR")) {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await listCertificateTemplates({ page: 1, page_size: 20 }, session.accessToken);

  return (
    <TemplateList
      initialData={initialData}
      currentUserId={session.user.id}
      isAdmin={session.user.userType === "ADMIN"}
    />
  );
}
