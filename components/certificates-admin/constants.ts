import type { CertificateBorderStyle } from "@/lib/api/certificates.types";

export const BORDER_STYLE_OPTIONS: { value: CertificateBorderStyle; label: string }[] = [
  { value: "CLASSIC", label: "Classic — ornate double frame" },
  { value: "MODERN", label: "Modern — single clean border" },
  { value: "NONE", label: "None — no border" },
];

export const FONT_FAMILY_OPTIONS: { value: string; label: string }[] = [
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times-Roman", label: "Times Roman" },
  { value: "Courier", label: "Courier" },
];

export function borderStyleLabel(value: CertificateBorderStyle): string {
  return BORDER_STYLE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
