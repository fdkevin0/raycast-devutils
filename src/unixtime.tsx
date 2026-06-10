import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const trimmed = text.trim();

    // Parse as unix timestamp (seconds or milliseconds)
    let timestamp: number;
    if (/^\d{10}$/.test(trimmed)) {
      timestamp = parseInt(trimmed) * 1000; // seconds
    } else if (/^\d{13}$/.test(trimmed)) {
      timestamp = parseInt(trimmed); // milliseconds
    } else {
      // Treat as date string, convert to timestamp
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      const unixSeconds = Math.floor(date.getTime() / 1000);
      const unixMs = date.getTime();
      const result = [
        `Input: ${trimmed}`,
        `Unix timestamp (s): ${unixSeconds}`,
        `Unix timestamp (ms): ${unixMs}`,
        `ISO 8601: ${date.toISOString()}`,
        `UTC: ${date.toUTCString()}`,
        `Local: ${date.toLocaleString()}`,
      ].join("\n");
      await copyToClipboard(result, "Unix time converted");
      return;
    }

    const date = new Date(timestamp);
    const result = [
      `Unix timestamp: ${trimmed}`,
      `ISO 8601: ${date.toISOString()}`,
      `UTC: ${date.toUTCString()}`,
      `Local: ${date.toLocaleString()}`,
      `Day: ${date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
    ].join("\n");

    await copyToClipboard(result, "Unix time converted");
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not convert time",
      message: "Enter a unix timestamp (10/13 digits) or date string",
    });
  }
}
