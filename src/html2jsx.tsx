import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    // Convert HTML to JSX:
    // 1. class -> className
    // 2. for -> htmlFor
    // 3. Close self-closing tags (br, img, input, hr, etc.)
    // 4. Style string -> style object (basic)
    // 5. Inline event handlers -> camelCase

    let jsx = text
      .replace(/\bclass=/g, "className=")
      .replace(/\bfor=/g, "htmlFor=")
      .replace(/\btabindex=/g, "tabIndex=")
      .replace(/\bviewBox=/g, "viewBox=")
      .replace(/\bstroke-width=/g, "strokeWidth=")
      .replace(/\bstroke-dasharray=/g, "strokeDasharray=")
      .replace(/\bfill-rule=/g, "fillRule=")
      .replace(/\bclip-rule=/g, "clipRule=")
      .replace(/\bclip-path=/g, "clipPath=")
      .replace(/\bxml:space=/g, "xmlSpace=")
      .replace(/\bxlink:href=/g, "xlinkHref=")
      // Self-close void elements
      .replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>]*?)(?<!\/)>/g, "<$1$2 />")
      // Convert data-* attributes (keep as-is in JSX)
      // Convert aria-* attributes (keep as-is in JSX)
      .replace(/<!--[\s\S]*?-->/g, "{/* $& */}")
      // Convert inline styles
      .replace(/style="([^"]*)"/g, (_, styles) => {
        const styleObj = styles
          .split(";")
          .filter(Boolean)
          .map((s: string) => {
            const [key, val] = s.split(":").map((p: string) => p.trim());
            // Convert CSS property to camelCase
            const camelKey = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
            return `${camelKey}: '${val}'`;
          })
          .join(", ");
        return `style={{ ${styleObj} }}`;
      });

    // Fix comment conversion
    jsx = jsx.replace(/\{<!-- /g, "{/* ").replace(/ -->\}/g, " */}");

    await copyToClipboard(jsx.trim(), "HTML → JSX converted");
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not convert HTML to JSX",
      message: "Check the clipboard content",
    });
  }
}
