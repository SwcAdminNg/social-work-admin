// The public pages whose forms send contact messages, keyed by the path
// the message records as its source page. Paths not listed here are shown
// as they are.
export const CONTACT_SOURCE_PAGES: { path: string; label: string }[] = [
  { path: "/", label: "Home page" },
  { path: "/contact", label: "Contact Us" },
  { path: "/mentorship", label: "Mentorship" },
  { path: "/e-learning", label: "E-Learning and Professional Development" },
  { path: "/research-and-evaluation", label: "Research and Evaluation" },
  { path: "/policy-and-advocacy", label: "Policy and Advocacy" },
  { path: "/careers-and-volunteering", label: "Careers and Volunteering" },
  { path: "/partner-with-us", label: "Partner with Us" },
  { path: "/pricing", label: "Pricing" },
];

export function formatSourcePage(path?: string | null): string {
  if (!path) return "Not recorded";
  const known = CONTACT_SOURCE_PAGES.find((p) => p.path === path);
  return known ? known.label : path;
}
