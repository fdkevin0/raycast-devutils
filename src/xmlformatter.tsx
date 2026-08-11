import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

function formatXml(xml: string): string {
  let formatted = "";
  let indent = 0;
  const tab = "  ";

  // Remove comments for simplicity
  xml = xml.replace(/<!--[\s\S]*?-->/g, "");

  // Tokenize
  const tokens = xml
    .replace(/>\s*</g, "><")
    .replace(/</g, "\n<")
    .replace(/>/g, ">\n")
    .split("\n")
    .filter((t) => t.trim());

  for (const token of tokens) {
    if (token.startsWith("</")) {
      indent--;
      formatted += tab.repeat(Math.max(0, indent)) + token + "\n";
    } else if (token.startsWith("<") && token.endsWith("/>")) {
      formatted += tab.repeat(indent) + token + "\n";
    } else if (token.startsWith("<") && token.endsWith(">")) {
      formatted += tab.repeat(indent) + token + "\n";
      if (!token.startsWith("<?") && !token.startsWith("<!")) {
        indent++;
      }
    } else {
      formatted += tab.repeat(indent) + token + "\n";
    }
  }
  return formatted.trim();
}

function minifyXml(xml: string): string {
  return xml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    // Determine if it looks minified (few newlines)
    if (text.includes("\n") && text.split("\n").length > 3) {
      // Already somewhat formatted, re-format it
      const formatted = formatXml(text);
      await copyToClipboard(formatted, "XML formatted");
    } else {
      // Try beautifying
      const formatted = formatXml(text);
      await copyToClipboard(formatted, "XML formatted");
    }
  } catch {
    try {
      const minified = minifyXml(text);
      await copyToClipboard(minified, "XML minified");
    } catch {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could not format XML",
        message: "Check the clipboard content",
      });
    }
  }
}
