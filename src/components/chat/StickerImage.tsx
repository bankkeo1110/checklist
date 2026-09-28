"use client";

import { useState } from "react";
import { findSticker, stickerStaticUrl, stickerUrl } from "@/lib/stickers";

/** Animated sticker, falling back to the plain emoji if the image can't load. */
export default function StickerImage({ id, size, animated = true }: { id: string; size: number; animated?: boolean }) {
  const [failed, setFailed] = useState(false);
  const emoji = findSticker(id)?.emoji ?? "❓";
  if (failed) {
    return (
      <span style={{ fontSize: size * 0.8, lineHeight: `${size}px`, width: size, height: size }} className="block text-center">
        {emoji}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external animated webp, no need for next/image
    <img src={animated ? stickerUrl(id) : stickerStaticUrl(id)} alt={emoji} width={size} height={size} loading="lazy" onError={() => setFailed(true)} draggable={false} />
  );
}
