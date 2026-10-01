import { NextRequest, NextResponse } from "next/server";
import { pinyin } from "pinyin-pro";
import { getSession } from "@/lib/auth";

type Lang = "vi" | "zh";

const LANGPAIR: Record<Lang, string> = { vi: "vi", zh: "zh-CN" };

function hasChinese(s: string) {
  return /[一-鿿]/.test(s);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const from = (searchParams.get("from") ?? "vi") as Lang;
  const to = (searchParams.get("to") ?? "zh") as Lang;

  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });
  if (!LANGPAIR[from] || !LANGPAIR[to]) {
    return NextResponse.json({ error: "Bad language" }, { status: 400 });
  }

  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", q);
  url.searchParams.set("langpair", `${LANGPAIR[from]}|${LANGPAIR[to]}`);
  // Optional: raise the anonymous daily quota by providing a contact email.
  if (process.env.MYMEMORY_EMAIL) url.searchParams.set("de", process.env.MYMEMORY_EMAIL);

  let translation = "";
  const candidates: string[] = [];
  try {
    const res = await fetch(url, { headers: { "User-Agent": "checklist-mathfun-dictionary" } });
    const data = await res.json();
    translation = (data?.responseData?.translatedText ?? "").trim();
    if (Array.isArray(data?.matches)) {
      for (const m of data.matches) {
        const t = (m?.translation ?? "").trim();
        if (t && !candidates.includes(t)) candidates.push(t);
      }
    }
  } catch {
    return NextResponse.json({ error: "Translation service unavailable" }, { status: 502 });
  }

  // MyMemory sometimes returns the source unchanged as the primary result while
  // the real translation sits in `matches`. When translating into Chinese,
  // prefer the first candidate that actually contains Chinese characters.
  if (to === "zh" && !hasChinese(translation)) {
    const zh = candidates.find(hasChinese);
    if (zh) translation = zh;
  }

  if (!translation) {
    return NextResponse.json({ error: "No translation found" }, { status: 404 });
  }

  const alternatives = candidates.filter((t) => {
    if (t === translation) return false;
    if (t.toLowerCase() === q.toLowerCase()) return false; // echoed source
    return to === "zh" ? hasChinese(t) : !hasChinese(t);
  });

  // Attach pinyin for whichever side is Chinese.
  const chineseText = to === "zh" ? (hasChinese(translation) ? translation : "") : hasChinese(q) ? q : "";
  const pinyinText = chineseText ? pinyin(chineseText, { toneType: "symbol", type: "string" }) : "";

  return NextResponse.json({
    source: q,
    from,
    to,
    translation,
    pinyin: pinyinText,
    alternatives: alternatives.slice(0, 5),
  });
}
