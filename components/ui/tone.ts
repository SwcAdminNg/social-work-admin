/** Semantic colour for badges, pills, stat cards and banners. */
export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "danger" | "violet";

export function initials(name?: string | null) {
  return (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
