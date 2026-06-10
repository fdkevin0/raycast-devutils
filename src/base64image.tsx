import { Clipboard, showToast, Toast, showHUD } from "@raycast/api";
import { readClipboard } from "./utils/clipboard";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  // Check if clipboard is base64 image data
  const base64Pattern = /^data:image\/\w+;base64,/;
  const isDataUri = base64Pattern.test(text.trim());

  if (isDataUri) {
    // Decode: extract base64 and try to save/decode info
    const match = text.trim().match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const base64Data = match[2];
      // Show info about the image
      const sizeInBytes = Math.round((base64Data.length * 3) / 4);
      await showHUD(`Image: ${mimeType}, ~${sizeInBytes} bytes (decoded base64 data in clipboard)`);
      // Copy just the decoded info summary
      await Clipboard.copy(`Image Type: ${mimeType}\nBase64 Length: ${base64Data.length} chars\nApprox Size: ${sizeInBytes} bytes`);
      return;
    }
  }

  // Try to encode: check if clipboard contains an image file path
  // For now, just encode the text as base64 image data URI
  const encoded = `data:image/png;base64,${Buffer.from(text, "utf-8").toString("base64")}`;
  await Clipboard.copy(encoded);
  await showHUD("Encoded to Base64 Image Data URI");
}
