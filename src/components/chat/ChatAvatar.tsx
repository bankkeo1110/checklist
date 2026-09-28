import PersonBadge from "@/components/PersonBadge";

/** A person's badge, or a house badge for the family group (avatarName null). */
export default function ChatAvatar({ avatarName, size = 44 }: { avatarName: string | null; size?: number }) {
  if (avatarName) {
    return <PersonBadge name={avatarName} size={size} iconSize={size * 0.4} radius={size * 0.32} />;
  }
  return (
    <span
      className="flex flex-none items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: "linear-gradient(150deg,#FFC93C,#FF9F45)",
        boxShadow: "0 6px 14px -6px rgba(255,159,69,.5)",
        fontSize: size * 0.5,
        lineHeight: 1,
      }}
    >
      🏠
    </span>
  );
}
