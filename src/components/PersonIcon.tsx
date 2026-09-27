import { Rocket, Gamepad2, Hammer, Leaf, FlaskConical, type LucideProps } from "lucide-react";

export default function PersonIcon({ name, ...props }: { name: string } & LucideProps) {
  switch (name) {
    case "OTIS":
      return <Rocket {...props} />;
    case "LIAM":
      return <Gamepad2 {...props} />;
    case "TINH":
      return <Hammer {...props} />;
    case "LOAN":
      return <Leaf {...props} />;
    case "TEST":
      return <FlaskConical {...props} />;
    default:
      return <Rocket {...props} />;
  }
}
