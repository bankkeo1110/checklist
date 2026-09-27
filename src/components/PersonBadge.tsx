import PersonIcon from "@/components/PersonIcon";
import { personTheme } from "@/lib/personTheme";

export default function PersonBadge({
  name,
  size = 44,
  iconSize = 18,
  radius = 14,
  emoji,
}: {
  name: string;
  size?: number;
  iconSize?: number;
  radius?: number;
  /** Dragon Ball avatar tier emoji, if the child has opened one — takes over from the default PersonIcon. */
  emoji?: string;
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
      {emoji ? (
        <span style={{ fontSize: iconSize * 1.3, lineHeight: 1 }}>{emoji}</span>
      ) : (
        <PersonIcon name={name} size={iconSize} strokeWidth={1.8} />
      )}
    </span>
  );
}
