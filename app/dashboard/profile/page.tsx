import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconUserCircle } from "@/components/dashboard/icons";

export default function ProfilePage() {
  return (
    <EmptyState
      icon={IconUserCircle}
      title="Your profile"
      description="Manage your personal details, contact information, and profile photo here."
    />
  );
}
