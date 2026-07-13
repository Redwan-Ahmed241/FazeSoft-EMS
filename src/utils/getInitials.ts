export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// A beautiful, modern, harmonious set of color combinations for background/text.
// Using subtle Tailwind-like background/text pairs or clean HSL palettes.
const AVATAR_COLORS = [
  { bg: "#FEE2E2", text: "#991B1B" }, // Red
  { bg: "#FEF3C7", text: "#92400E" }, // Amber
  { bg: "#D1FAE5", text: "#065F46" }, // Emerald
  { bg: "#DBEAFE", text: "#1E40AF" }, // Blue
  { bg: "#E0E7FF", text: "#3730A3" }, // Indigo
  { bg: "#F3E8FF", text: "#6B21A8" }, // Purple
  { bg: "#FCE7F3", text: "#9D174D" }, // Pink
  { bg: "#E0F2FE", text: "#0369A1" }, // Sky
  { bg: "#F5F5F4", text: "#44403C" }, // Stone
];

export function getAvatarColor(name: string): { bg: string; text: string } {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
