import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconBookOpen } from "@/components/dashboard/icons";

export default function CoursesPage() {
  return (
    <EmptyState
      icon={IconBookOpen}
      title="No enrolled courses yet"
      description="Courses you enroll in will show up here, along with your progress and certificates."
    />
  );
}
