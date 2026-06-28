import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconStar } from "@/components/dashboard/icons";

export default function ReviewsPage() {
  return (
    <EmptyState
      icon={IconStar}
      title="No reviews yet"
      description="Reviews you leave for courses and instructors will appear here."
    />
  );
}
