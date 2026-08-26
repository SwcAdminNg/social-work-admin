import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCertificateTemplate } from "@/lib/api/certificates";
import { ApiError } from "@/lib/api/client";
import { TemplateEditor } from "@/components/certificates-admin/TemplateEditor";

export default async function CertificateTemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.accessToken || (session.user.userType !== "ADMIN" && session.user.userType !== "INSTRUCTOR")) {
    redirect("/dashboard/not-authorized");
  }

  const template = await fetchTemplate(id, session.accessToken);
  const canManage = session.user.userType === "ADMIN" || template.owner_id === session.user.id;
  return <TemplateEditor initialTemplate={template} canManage={canManage} />;
}

async function fetchTemplate(id: string, token: string) {
  try {
    return await getCertificateTemplate(id, token);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    throw error;
  }
}
