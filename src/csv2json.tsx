import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("Need at least header + data row");

  // Parse by comma, handling quoted fields
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || "";
    });
    return obj;
  });
}

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const data = parseCsv(text);
    const json = JSON.stringify(data, null, 2);
    await copyToClipboard(json, "CSV → JSON");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not convert CSV to JSON",
      message: error instanceof Error ? error.message : "Invalid CSV",
    });
  }
}
