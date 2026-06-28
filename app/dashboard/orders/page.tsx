import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconReceipt } from "@/components/dashboard/icons";

export default function OrdersPage() {
  return (
    <EmptyState
      icon={IconReceipt}
      title="No orders yet"
      description="Your course purchases and payment receipts will be listed here."
    />
  );
}
