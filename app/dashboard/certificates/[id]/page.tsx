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

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const template = await fetchTemplate(id, session.accessToken);
  return <TemplateEditor initialTemplate={template} />;
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
