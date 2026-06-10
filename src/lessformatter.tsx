import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    // Use prettier with CSS parser for LESS (similar enough)
    const prettier = await import("prettier");
    const formatted = await prettier.format(text, {
      parser: "css",
      printWidth: 80,
      tabWidth: 2,
    });
    if (formatted !== text) {
      await copyToClipboard(formatted, "LESS formatted");
      return;
    }
  } catch {
    // Try minifying
  }

  try {
    const minified = text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;,>+~])\s*/g, "$1")
      .replace(/;\}/g, "}")
      .trim();
    await copyToClipboard(minified, "LESS minified");
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not format LESS",
      message: "Check the clipboard content",
    });
  }
}
