import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

/**
 * Very basic PHP array to JSON converter.
 * Handles quoted string keys =>, nested arrays, and basic scalar values.
 */
function phpArrayToJson(text: string): string {
  // Remove PHP tags
  let s = text.replace(/<\?php\s*/gi, "").replace(/\?>\s*$/g, "").trim();

  // Remove "return" keyword
  s = s.replace(/^return\s+/, "");

  // Convert PHP array syntax to JSON
  // Replace => with :
  s = s.replace(/=>/g, ":");

  // Replace PHP null/true/false with JSON equivalents
  s = s.replace(/\bnull\b/g, "null");
  s = s.replace(/\btrue\b/g, "true");
  s = s.replace(/\bfalse\b/g, "false");

  // Replace PHP-style array brackets with JSON brackets
  // Handle array( ... ) -> [ ... ]
  s = s.replace(/\barray\s*\(/g, "[");
  // Close unmatched parentheses with ]
  let depth = 0;
  let result = "";
  let inString = false;
  let stringChar = "";
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (inString) {
      result += char;
      if (char === "\\") {
        // Skip next char in string
        i++;
        if (i < s.length) result += s[i];
        continue;
      }
      if (char === stringChar) inString = false;
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        stringChar = char;
        result += '"'; // Convert to double quotes for JSON
      } else if (char === "(") {
        depth++;
        result += "[";
      } else if (char === ")") {
        depth--;
        result += "]";
      } else {
        result += char;
      }
    }
  }

  // Convert single-quoted strings to double-quoted JSON strings
  result = result.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, inner) => {
    return `"${inner.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`;
  });

  // Parse as JSON
  return JSON.stringify(JSON.parse(result), null, 2);
}

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const json = phpArrayToJson(text);
    await copyToClipboard(json, "PHP → JSON");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not convert PHP to JSON",
      message: "Make sure clipboard contains a valid PHP array definition",
    });
  }
}
