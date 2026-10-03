import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccessProvider } from "@/components/studio/AccessContext";
import { CourseEditor } from "@/components/studio/editor/CourseEditor";
import { CourseEditorProvider } from "@/components/studio/editor/CourseEditorContext";
import { CourseUnavailable } from "@/components/studio/editor/CourseUnavailable";
import { adminAccess, readAccess, readCourse } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

export default async function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const [access, result] = await Promise.all([readAccess(session.accessToken), readCourse(id, session.accessToken)]);

  return (
    <AccessProvider access={adminAccess(access)}>
      {result.course ? (
        <CourseEditorProvider courseId={id} initialCourse={result.course}>
          {/* Suspense: the editor reads ?tab= / ?item= with useSearchParams. */}
          <Suspense>
            <CourseEditor />
          </Suspense>
        </CourseEditorProvider>
      ) : (
        <CourseUnavailable status={result.status} />
      )}
    </AccessProvider>
  );
}
