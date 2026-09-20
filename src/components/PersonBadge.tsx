import PersonIcon from "@/components/PersonIcon";
import { personTheme } from "@/lib/personTheme";

export default function PersonBadge({
  name,
  size = 44,
  iconSize = 18,
  radius = 14,
}: {
  name: string;
  size?: number;
  iconSize?: number;
  radius?: number;
}) {
  const theme = personTheme(name);
  return (
    <span
      className="flex flex-none items-center justify-center text-white"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: theme.gradient,
        boxShadow: `0 6px 14px -6px ${theme.shadow}`,
      }}
    >
      <PersonIcon name={name} size={iconSize} strokeWidth={1.8} />
    </span>
  );
}
