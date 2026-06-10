import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    // Try to parse and format JSON
    const parsed = JSON.parse(text);
    const formatted = JSON.stringify(parsed, null, 2);
    await copyToClipboard(formatted, "JSON formatted");
  } catch {
    // Try to minify (if it's already JSON-like)
    try {
      const parsed = JSON.parse(text);
      const minified = JSON.stringify(parsed);
      await copyToClipboard(minified, "JSON minified");
    } catch {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid JSON",
        message: "Could not parse clipboard content as JSON",
      });
    }
  }
}
