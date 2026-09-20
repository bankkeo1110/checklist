export type PersonTheme = {
  solid: string;
  solidLight: string;
  gradient: string;
  shadow: string;
  tint: string;
  text: string;
};

const PERSON_THEME: Record<string, PersonTheme> = {
  OTIS: {
    solid: "#4D96FF",
    solidLight: "#6BA8FF",
    gradient: "linear-gradient(150deg,#4D96FF,#6BA8FF)",
    shadow: "rgba(77,150,255,.5)",
    tint: "#E8F3FF",
    text: "#2D6FE0",
  },
  LIAM: {
    solid: "#6BCB77",
    solidLight: "#4FB35B",
    gradient: "linear-gradient(150deg,#6BCB77,#4FB35B)",
    shadow: "rgba(107,203,119,.5)",
    tint: "#E9F8EA",
    text: "#3E9C4A",
  },
  TINH: {
    solid: "#FF9F45",
    solidLight: "#FF6B6B",
    gradient: "linear-gradient(150deg,#FF9F45,#FF6B6B)",
    shadow: "rgba(255,107,107,.5)",
    tint: "#FFEDEA",
    text: "#E0563F",
  },
  LOAN: {
    solid: "#B983FF",
    solidLight: "#9C6BE0",
    gradient: "linear-gradient(150deg,#B983FF,#9C6BE0)",
    shadow: "rgba(185,131,255,.5)",
    tint: "#F3EAFF",
    text: "#8A4FDB",
  },
};

export function personTheme(name: string): PersonTheme {
  return PERSON_THEME[name] ?? PERSON_THEME.OTIS;
}
