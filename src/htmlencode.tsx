import { readClipboard, copyToClipboard } from "./utils/clipboard";

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const HTML_ENTITIES_REVERSE: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&apos;": "'",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] || char);
}

function unescapeHtml(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39|#x27|apos);/g, (entity) => HTML_ENTITIES_REVERSE[entity] || entity);
}

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  // If text contains HTML entities, unescape
  if (/&(?:amp|lt|gt|quot|#39|#x27|apos);/.test(text)) {
    const unescaped = unescapeHtml(text);
    await copyToClipboard(unescaped, "HTML entities decoded");
  } else {
    const escaped = escapeHtml(text);
    await copyToClipboard(escaped, "HTML entities encoded");
  }
}
