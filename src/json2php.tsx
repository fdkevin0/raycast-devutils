import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

function jsonToPhp(obj: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);

  if (obj === null) return "null";
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "string") {
    // Escape single quotes for PHP
    return `'${obj.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    const items = obj.map((item) => `${padInner}${jsonToPhp(item, indent + 1)}`).join(",\n");
    return `[\n${items}\n${pad}]`;
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return "[]";
    const items = entries
      .map(([key, value]) => `${padInner}'${key.replace(/'/g, "\\'")}' => ${jsonToPhp(value, indent + 1)}`)
      .join(",\n");
    return `[\n${items}\n${pad}]`;
  }

  return "null";
}

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const data = JSON.parse(text);
    const php = "<?php\n\nreturn " + jsonToPhp(data) + ";\n";
    await copyToClipboard(php, "JSON → PHP Array");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not convert JSON to PHP",
      message: error instanceof Error ? error.message : "Invalid JSON",
    });
  }
}
