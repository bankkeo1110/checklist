// Chat stickers: Google's animated Noto Emoji (Apache 2.0), served from
// fonts.gstatic.com. Each id is the emoji's codepoint key there; every id
// below was checked to exist as both an animated 512.webp and a static emoji.svg. If the image fails to
// load, the UI falls back to the plain emoji.

export type Sticker = { id: string; emoji: string };

export const STICKERS: Sticker[] = [
  { id: "1f600", emoji: "😀" },
  { id: "1f602", emoji: "😂" },
  { id: "1f970", emoji: "🥰" },
  { id: "1f929", emoji: "🤩" },
  { id: "1f60e", emoji: "😎" },
  { id: "1f61c", emoji: "😜" },
  { id: "1f60b", emoji: "😋" },
  { id: "1f618", emoji: "😘" },
  { id: "1f917", emoji: "🤗" },
  { id: "1f607", emoji: "😇" },
  { id: "1f914", emoji: "🤔" },
  { id: "1f9d0", emoji: "🧐" },
  { id: "1f97a", emoji: "🥺" },
  { id: "1f62d", emoji: "😭" },
  { id: "1f631", emoji: "😱" },
  { id: "1f92f", emoji: "🤯" },
  { id: "1f634", emoji: "😴" },
  { id: "1f973", emoji: "🥳" },
  { id: "1f47b", emoji: "👻" },
  { id: "1f648", emoji: "🙈" },
  { id: "1f44d", emoji: "👍" },
  { id: "1f44f", emoji: "👏" },
  { id: "1f44b", emoji: "👋" },
  { id: "1f4aa", emoji: "💪" },
  { id: "1f64f", emoji: "🙏" },
  { id: "2764_fe0f", emoji: "❤️" },
  { id: "1f525", emoji: "🔥" },
  { id: "1f4af", emoji: "💯" },
  { id: "2b50", emoji: "⭐" },
  { id: "1f389", emoji: "🎉" },
  { id: "1f38a", emoji: "🎊" },
  { id: "1f3c6", emoji: "🏆" },
  { id: "1f308", emoji: "🌈" },
  { id: "1f31e", emoji: "🌞" },
  { id: "1f431", emoji: "🐱" },
  { id: "1f415", emoji: "🐕" },
  { id: "1f43c", emoji: "🐼" },
  { id: "1f984", emoji: "🦄" },
  { id: "1f996", emoji: "🦖" },
  { id: "1f422", emoji: "🐢" },
  { id: "1f98b", emoji: "🦋" },
  { id: "1f680", emoji: "🚀" },
  { id: "26bd", emoji: "⚽" },
  { id: "1f355", emoji: "🍕" },
  { id: "1f366", emoji: "🍦" },
  { id: "1f382", emoji: "🎂" },
  { id: "1f4da", emoji: "📚" },
];

const BY_ID = new Map(STICKERS.map((s) => [s.id, s]));

export function findSticker(id: string): Sticker | undefined {
  return BY_ID.get(id);
}

/** Animated (~300–700 KB each) — only for stickers actually sent in a chat. */
export function stickerUrl(id: string) {
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/512.webp`;
}

/** Static SVG (~10 KB) — for the picker grid, so opening it stays light. */
export function stickerStaticUrl(id: string) {
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/emoji.svg`;
}
