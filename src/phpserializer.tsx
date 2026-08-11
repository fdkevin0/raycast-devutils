import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const trimmed = text.trim();

    // Encode what looks like an array/object
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const data = JSON.parse(trimmed);
        const serialized = jsonToPhpSerialize(data);
        await copyToClipboard(serialized, "PHP serialized");
        return;
      } catch {
        // Will fall through to error
      }
    }

    // Try to detect PHP code like: $var = ['key' => 'value'];
    // or: return ['key' => 'value'];
    let phpCode = trimmed
      .replace(/^\$\w+\s*=\s*/, "")
      .replace(/^return\s+/, "")
      .replace(/;\s*$/, "");

    // Basic PHP array literal to JSON conversion, then serialize
    phpCode = phpCode
      .replace(/=>/g, ":")
      .replace(/\barray\s*\(/, "[")
      .replace(/'(?:\\.|[^'\\])*'/g, (m) => `"${m.slice(1, -1).replace(/"/g, '\\"')}"`);

    // Replace remaining ( with [ and ) with ]
    let result = "";
    for (const ch of phpCode) {
      if (ch === "(") {
        result += "[";
      } else if (ch === ")") {
        result += "]";
      } else {
        result += ch;
      }
    }

    const data = JSON.parse(result);
    const serialized = jsonToPhpSerialize(data);
    await copyToClipboard(serialized, "PHP serialized");
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not serialize",
      message: "Make sure clipboard contains valid JSON array/object",
    });
  }
}

function jsonToPhpSerialize(data: unknown): string {
  if (data === null) return "N;";
  if (typeof data === "boolean") return `b:${data ? "1" : "0"};`;
  if (typeof data === "number") {
    if (Number.isInteger(data)) return `i:${data};`;
    return `d:${data};`;
  }
  if (typeof data === "string") {
    return `s:${Buffer.byteLength(data, "utf-8")}:"${data}";`;
  }
  if (Array.isArray(data)) {
    const items = data.map((v, i) => `i:${i};${jsonToPhpSerialize(v)}`).join("");
    return `a:${data.length}:{${items}}`;
  }
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    const items = entries.map(([k, v]) => `${jsonToPhpSerialize(k)}${jsonToPhpSerialize(v)}`).join("");
    return `a:${entries.length}:{${items}}`;
  }
  return "N;";
}
