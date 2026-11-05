// Contact message categories. The first five match the enquiry types on the
// website's contact form; General and Pricing come from older forms.
export const CONTACT_CATEGORIES: { value: string; label: string }[] = [
  { value: "courses", label: "Course Enquiry" },
  { value: "mentorship", label: "Mentorship" },
  { value: "account_support", label: "Account or Learning Support" },
  { value: "partnership", label: "Partnership or Organisational Enquiry" },
  { value: "other", label: "Other" },
  { value: "mentor_application", label: "Mentor Application" },
  { value: "general", label: "General" },
  { value: "pricing", label: "Pricing" },
];

export function formatCategory(value?: string | null, apiLabel?: string | null): string {
  if (apiLabel) return apiLabel;
  if (!value) return "General";
  return CONTACT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
