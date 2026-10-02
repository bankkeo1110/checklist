"use client";

import { Fragment, type ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

const IMG_BASE = "https://s3.vio.edu.vn/image_question/";

type Token =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string }
  | { kind: "image"; src: string }
  | { kind: "blank"; index: number };

function tokenize(content: string): Token[] {
  const tokens: Token[] = [];
  // $...$ math, [I:file]/[U:url] images, {} blanks — scanned left to right in one pass.
  const re = /\$([^$]+)\$|\[I:([^\]]+)\]|\[U:([^\]]+)\]|\{\}/g;
  let last = 0;
  let blankIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content))) {
    if (match.index > last) tokens.push({ kind: "text", value: content.slice(last, match.index) });
    if (match[1] !== undefined) tokens.push({ kind: "math", value: match[1] });
    else if (match[2] !== undefined) tokens.push({ kind: "image", src: IMG_BASE + match[2] });
    else if (match[3] !== undefined) tokens.push({ kind: "image", src: match[3] });
    else tokens.push({ kind: "blank", index: blankIndex++ });
    last = re.lastIndex;
  }
  if (last < content.length) tokens.push({ kind: "text", value: content.slice(last) });
  return tokens;
}

function Math({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, output: "html" });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Renders a question/choice string: `$..$` math, `[I:]`/`[U:]` images, and
 * `{}` blanks. By default a blank renders as a plain dashed placeholder;
 * pass `renderBlank` to inject an interactive input (exam-taking mode).
 */
export default function MathText({
  content,
  renderBlank,
}: {
  content: string;
  renderBlank?: (index: number) => ReactNode;
}) {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className={i === 0 ? "font-semibold" : "mt-1.5"}>
          {tokenize(line).map((t, j) => {
            switch (t.kind) {
              case "text":
                return <Fragment key={j}>{t.value}</Fragment>;
              case "math":
                return <Math key={j} tex={t.value} />;
              case "image":
                // eslint-disable-next-line @next/next/no-img-element -- external, size unknown ahead of time
                return <img key={j} src={t.src} alt="Hình minh họa" className="my-2 block max-w-full rounded" />;
              case "blank":
                return (
                  <span key={j} className="mx-1 inline-block align-middle">
                    {renderBlank ? (
                      renderBlank(t.index)
                    ) : (
                      <span className="inline-block min-w-[48px] rounded border-b-2 border-dashed border-blue bg-blue-tint px-2 text-center text-sm">
                        ({t.index + 1})
                      </span>
                    )}
                  </span>
                );
            }
          })}
        </p>
      ))}
    </>
  );
}
