import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";
import * as prettier from "prettier";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    // Try beautifying
    const formatted = await prettier.format(text, {
      parser: "babel",
      printWidth: 80,
      tabWidth: 2,
    });
    if (formatted !== text) {
      await copyToClipboard(formatted, "JavaScript formatted");
      return;
    }
  } catch {
    // Will try minifying
  }

  // Try minifying
  try {
    const minified = text
      .replace(/\/\/.*$/gm, "") // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
      .replace(/\s+/g, " ")
      .replace(/\s*([{}();,:])\s*/g, "$1")
      .trim();
    await copyToClipboard(minified, "JavaScript minified");
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not format JavaScript",
      message: "Check the clipboard content",
    });
  }
}
