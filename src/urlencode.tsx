import { readClipboard, copyToClipboard } from "./utils/clipboard";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  // Try to decode URL-encoded string
  if (text.includes("%") && /%[0-9A-Fa-f]{2}/.test(text)) {
    try {
      const decoded = decodeURIComponent(text);
      if (decoded !== text) {
        await copyToClipboard(decoded, "URL decoded");
        return;
      }
    } catch {
      // Invalid URL encoding, will encode instead
    }
  }

  // Encode as URL
  const encoded = encodeURIComponent(text);
  await copyToClipboard(encoded, "URL encoded");
}
