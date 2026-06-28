import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconMessageQuestion } from "@/components/dashboard/icons";

export default function QuestionAndAnswerPage() {
  return (
    <EmptyState
      icon={IconMessageQuestion}
      title="No questions yet"
      description="Questions you ask instructors and their answers will show up here."
    />
  );
}
