import { readClipboard, copyToClipboard } from "./utils/clipboard";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  // Escape backslashes and common escape sequences
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/"/g, '\\"');

  // If already escaped, unescape
  if (text.includes("\\n") || text.includes("\\t") || text.includes("\\\\")) {
    const unescaped = text
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
    await copyToClipboard(unescaped, "Unescaped backslashes");
    return;
  }

  await copyToClipboard(escaped, "Escaped backslashes");
}
