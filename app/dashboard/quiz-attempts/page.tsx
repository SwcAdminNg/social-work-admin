import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconClipboardCheck } from "@/components/dashboard/icons";

export default function QuizAttemptsPage() {
  return (
    <EmptyState
      icon={IconClipboardCheck}
      title="No quiz attempts yet"
      description="Your quiz history and scores will be tracked here once you take a quiz."
    />
  );
}
