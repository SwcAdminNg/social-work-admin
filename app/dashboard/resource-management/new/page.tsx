import { Suspense } from "react";
import { NewResourcePageContent } from "@/components/resources-admin/NewResourcePageContent";

export default function NewResourcePage() {
  return (
    <Suspense fallback={null}>
      <NewResourcePageContent />
    </Suspense>
  );
}
