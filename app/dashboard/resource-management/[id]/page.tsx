import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getManagedResource } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";
import { ResourceEditor } from "@/components/studio/resources/ResourceEditor";
import { ResourceEditorProvider } from "@/components/studio/resources/ResourceEditorContext";

export const dynamic = "force-dynamic";

export default async function ResourceEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const isStaff = session?.user?.userType === "ADMIN" || session?.user?.userType === "INSTRUCTOR";
  if (!session?.accessToken || !isStaff) {
    redirect("/dashboard/not-authorized");
  }

  const resource = await fetchResource(id, session.accessToken);
  return (
    <ResourceEditorProvider resourceId={id} initialResource={resource}>
      {/* Suspense: the editor reads ?tab= with useSearchParams. */}
      <Suspense>
        <ResourceEditor />
      </Suspense>
    </ResourceEditorProvider>
  );
}

async function fetchResource(id: string, token: string) {
  try {
    return await getManagedResource(id, token);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    throw error;
  }
}
