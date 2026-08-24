import { IconLifeBuoy } from "@/components/dashboard/icons";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function NotStaffNotice() {
  return (
    <EmptyState
      icon={IconLifeBuoy}
      title="No Support Desk access"
      description="You don't have staff access to Help & Support yet. Ask an admin to add you to the “Support Desk” group under Groups."
    />
  );
}
