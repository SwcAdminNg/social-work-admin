import {
  Baby,
  BookOpen,
  Briefcase,
  Brain,
  Building2,
  Calculator,
  Camera,
  Code,
  Compass,
  FileText,
  GraduationCap,
  Globe,
  Heart,
  HeartHandshake,
  Home,
  Laptop,
  Languages,
  Leaf,
  Lightbulb,
  LineChart,
  Megaphone,
  Monitor,
  Music,
  Palette,
  Scale,
  ShieldCheck,
  Stethoscope,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * The student site renders a catalog's `icon_name` as the lucide-react icon of
 * that exact name (falling back to BookOpen). Offering only names we know it can
 * resolve - instead of a free-text box - is what keeps admin and student site in
 * agreement. Keep this list to icons that exist in lucide-react.
 */
export const CATALOG_ICONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: "BookOpen", label: "Book", icon: BookOpen },
  { name: "GraduationCap", label: "Graduation", icon: GraduationCap },
  { name: "Users", label: "People", icon: Users },
  { name: "HeartHandshake", label: "Support", icon: HeartHandshake },
  { name: "Heart", label: "Care", icon: Heart },
  { name: "Baby", label: "Child", icon: Baby },
  { name: "Home", label: "Family", icon: Home },
  { name: "Brain", label: "Mind", icon: Brain },
  { name: "Stethoscope", label: "Health", icon: Stethoscope },
  { name: "ShieldCheck", label: "Safeguarding", icon: ShieldCheck },
  { name: "Scale", label: "Law & ethics", icon: Scale },
  { name: "Briefcase", label: "Practice", icon: Briefcase },
  { name: "Building2", label: "Organisations", icon: Building2 },
  { name: "Globe", label: "Community", icon: Globe },
  { name: "Compass", label: "Guidance", icon: Compass },
  { name: "Target", label: "Goals", icon: Target },
  { name: "Lightbulb", label: "Ideas", icon: Lightbulb },
  { name: "LineChart", label: "Research", icon: LineChart },
  { name: "Calculator", label: "Finance", icon: Calculator },
  { name: "Laptop", label: "Technology", icon: Laptop },
  { name: "Monitor", label: "IT", icon: Monitor },
  { name: "Code", label: "Development", icon: Code },
  { name: "Palette", label: "Design", icon: Palette },
  { name: "Megaphone", label: "Advocacy", icon: Megaphone },
  { name: "Camera", label: "Media", icon: Camera },
  { name: "Music", label: "Music", icon: Music },
  { name: "Languages", label: "Language", icon: Languages },
  { name: "Leaf", label: "Wellbeing", icon: Leaf },
  { name: "FileText", label: "Documents", icon: FileText },
];

// A prototype-less map, so a stored name like "constructor" can never resolve to something that isn't an icon.
const BY_NAME: Record<string, LucideIcon | undefined> = Object.assign(
  Object.create(null),
  Object.fromEntries(CATALOG_ICONS.map((i) => [i.name, i.icon])),
);

/** True when the student site would recognise this stored name too. */
export function isKnownCatalogIcon(name?: string | null): boolean {
  return !!name && BY_NAME[name] !== undefined;
}

/** Renders a catalog's icon with the same fallback (a book) the student site uses. */
export function CatalogIcon({ name, className, strokeWidth = 1.8 }: { name?: string | null; className?: string; strokeWidth?: number }) {
  const Icon = BY_NAME[name ?? ""] ?? BookOpen;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
