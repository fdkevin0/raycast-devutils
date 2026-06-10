import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : [data];

    if (arr.length === 0) {
      throw new Error("Empty array");
    }

    // Get all unique headers
    const headers = Array.from(new Set(arr.flatMap((obj) => Object.keys(obj))));

    // Escape CSV values
    function escapeCsv(val: unknown): string {
      const str = val === null || val === undefined ? "" : String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const csvLines = [headers.map(escapeCsv).join(",")];
    for (const row of arr) {
      csvLines.push(headers.map((h) => escapeCsv(row[h] ?? "")).join(","));
    }

    await copyToClipboard(csvLines.join("\n"), "JSON → CSV");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not convert JSON to CSV",
      message: error instanceof Error ? error.message : "Invalid JSON",
    });
  }
}
