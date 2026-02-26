import { Category, CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/types";

interface BadgeProps {
  category: Category;
  size?: "sm" | "md";
}

export default function Badge({ category, size = "md" }: BadgeProps) {
  const color = CATEGORY_COLORS[category];
  const icon = CATEGORY_ICONS[category];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs"
      }`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <span>{icon}</span>
      {category}
    </span>
  );
}
