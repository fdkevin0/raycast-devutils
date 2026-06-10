import { readClipboard, copyToClipboard } from "./utils/clipboard";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  // Try to decode base64
  try {
    const decoded = Buffer.from(text.trim(), "base64").toString("utf-8");
    // Check if the decoded string looks like valid text
    if (decoded && /^[\x20-\x7E\t\n\r -￿]*$/.test(decoded)) {
      await copyToClipboard(decoded, "Decoded from Base64");
      return;
    }
  } catch {
    // Not valid base64, will encode
  }

  // Encode to base64
  const encoded = Buffer.from(text, "utf-8").toString("base64");
  await copyToClipboard(encoded, "Encoded to Base64");
}
