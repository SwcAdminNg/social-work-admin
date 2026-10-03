import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccessProvider } from "@/components/studio/AccessContext";
import { CreateCourseWizard } from "@/components/studio/courses/CreateCourseWizard";
import { adminAccess, readAccess } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const access = await readAccess(session.accessToken);
  const name = [session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || session.user.name || "";

  return (
    <AccessProvider access={adminAccess(access)}>
      <CreateCourseWizard
        currentUser={name ? { user_id: session.user.id, name, profile_picture_url: session.user.image ?? null } : null}
      />
    </AccessProvider>
  );
}
