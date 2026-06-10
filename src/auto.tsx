import { Clipboard, showHUD, showToast, Toast } from "@raycast/api";

export default async function Command() {
  const text = await Clipboard.readText();

  if (!text || text.trim().length === 0) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Clipboard is empty",
      message: "Copy some text first",
    });
    return;
  }

  const trimmed = text.trim();

  // Detect the content type
  const detections: { name: string; score: number }[] = [];

  // JSON detection
  try {
    JSON.parse(trimmed);
    detections.push({ name: "jsonformatter", score: 90 });
  } catch { /* not JSON */ }

  // JWT detection
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmed)) {
    detections.push({ name: "jwt", score: 85 });
  }

  // URL detection
  if (/^https?:\/\//.test(trimmed)) {
    detections.push({ name: "querystringparser", score: 80 });
  }

  // Base64 detection
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length % 4 === 0) {
    detections.push({ name: "base64encode", score: 75 });
  }

  // Unix timestamp
  if (/^\d{10}$/.test(trimmed)) {
    detections.push({ name: "unixtime", score: 70 });
  }

  // UUID detection
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed)) {
    detections.push({ name: "uuidtool", score: 70 });
  }

  // HTML detection
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    detections.push({ name: "htmlformatter", score: 65 });
  }

  // CSV detection
  if (trimmed.includes(",") && trimmed.includes("\n")) {
    const lines = trimmed.split("\n");
    if (lines.length >= 2) {
      const commaCount = lines[0].split(",").length;
      const consistent = lines.every((l) => l.split(",").length === commaCount);
      if (consistent && commaCount > 1) {
        detections.push({ name: "csv2json", score: 60 });
      }
    }
  }

  // URL-encoded
  if (/%[0-9A-Fa-f]{2}/.test(trimmed) && trimmed.includes("%")) {
    detections.push({ name: "urlencode", score: 55 });
  }

  // Cron expression
  if (/^(\*|[\d,*\/-]+)\s+(\*|[\d,*\/-]+)\s+(\*|[\d,*\/-]+)\s+(\*|[\d,*\/-]+)\s+(\*|[\d,*\/-]+)$/.test(trimmed)) {
    detections.push({ name: "cronparser", score: 50 });
  }

  // Markdown detection
  if (/^#+\s|\[.+\]\(.+\)|```|[-*]\s/.test(trimmed)) {
    detections.push({ name: "markdownpreview", score: 50 });
  }

  // Default: treat as string
  detections.push({ name: "stringinspect", score: 30 });

  // Sort by score (highest first)
  detections.sort((a, b) => b.score - a.score);

  const best = detections[0];
  const runnerUp = detections.length > 1 ? detections[1] : null;

  if (!runnerUp || best.score >= runnerUp.score + 20) {
    // High confidence - show the tool name
    await showHUD(`Best match: ${getToolDisplayName(best.name)} (${best.score}%)`);
    await Clipboard.copy(`${best.name}`);
  } else {
    // Multiple matches - show options
    const suggestions = detections.slice(0, 3).map((d) => getToolDisplayName(d.name)).join(", ");
    await showHUD(`Suggestions: ${suggestions}`);
    await Clipboard.copy(`${best.name}`);
  }
}

function getToolDisplayName(name: string): string {
  const names: Record<string, string> = {
    jsonformatter: "JSON Formatter",
    jwt: "JWT Debugger",
    querystringparser: "URL Parser",
    base64encode: "Base64 Decode",
    unixtime: "Unix Time",
    uuidtool: "UUID Tool",
    htmlformatter: "HTML Formatter",
    csv2json: "CSV to JSON",
    urlencode: "URL Decode",
    cronparser: "Cron Parser",
    markdownpreview: "Markdown Preview",
    stringinspect: "String Inspector",
  };
  return names[name] || name;
}
