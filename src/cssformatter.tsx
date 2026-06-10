import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";
import * as prettier from "prettier";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const formatted = await prettier.format(text, {
      parser: "css",
      printWidth: 80,
      tabWidth: 2,
    });
    if (formatted !== text) {
      await copyToClipboard(formatted, "CSS formatted");
      return;
    }
  } catch {
    // Try minifying
  }

  try {
    const minified = text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;,>+~])\s*/g, "$1")
      .replace(/;\}/g, "}")
      .trim();
    await copyToClipboard(minified, "CSS minified");
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not format CSS",
      message: "Check the clipboard content",
    });
  }
}
