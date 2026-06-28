import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconSettings } from "@/components/dashboard/icons";

export default function SettingsPage() {
  return (
    <EmptyState
      icon={IconSettings}
      title="Account settings"
      description="Password, notification preferences, and account settings will live here."
    />
  );
}
