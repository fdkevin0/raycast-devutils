import { Detail, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = usePromise(async () => {
    const text = await Clipboard.readText();
    if (!text) return null;

    const info: string[] = [];
    info.push(`## String Inspector\n`);

    const trimmed = text;
    const lines = trimmed.split(/\r?\n/);

    info.push(`### Basic Info`);
    info.push(`- **Length:** ${trimmed.length} characters`);
    info.push(`- **Bytes (UTF-8):** ${Buffer.byteLength(trimmed, "utf-8")} bytes`);
    info.push(`- **Lines:** ${lines.length}`);
    info.push(`- **Words:** ${trimmed.split(/\s+/).filter(Boolean).length}`);
    info.push("");

    // Character analysis
    const chars = trimmed.split("");
    const letterCount = chars.filter((c) => /\p{L}/u.test(c)).length;
    const digitCount = chars.filter((c) => /\d/.test(c)).length;
    const spaceCount = chars.filter((c) => /\s/.test(c)).length;
    const punctuationCount = chars.filter((c) => /\p{P}/u.test(c)).length;
    const symbolCount = chars.filter((c) => /\p{S}/u.test(c)).length;
    const emojiCount = chars.filter((c) => /\p{Emoji}/u.test(c)).length;

    info.push(`### Character Breakdown`);
    info.push(`- **Letters:** ${letterCount}`);
    info.push(`- **Digits:** ${digitCount}`);
    info.push(`- **Whitespace:** ${spaceCount}`);
    info.push(`- **Punctuation:** ${punctuationCount}`);
    info.push(`- **Symbols:** ${symbolCount}`);
    info.push(`- **Emoji:** ${emojiCount}`);
    info.push("");

    // Encoding checks
    const hasNonAscii = /[^\x00-\x7F]/.test(trimmed);
    const hasNonLatin = /\p{Script_Extensions=Latin}/u.test(trimmed) === false || /[^\p{Script=Latin}\s\d\p{P}]/u.test(trimmed);

    info.push(`### Encoding`);
    info.push(`- **ASCII only:** ${hasNonAscii ? "No" : "Yes"}`);
    info.push(`- **Contains non-Latin scripts:** ${hasNonLatin ? "Yes" : "No"}`);

    // Detect common patterns
    if (/^\s*[{[]/.test(trimmed) && /[}\]]\s*$/.test(trimmed)) {
      info.push(`- **Looks like:** JSON`);
    }
    if (/^[a-zA-Z0-9+/=]+$/.test(trimmed) && trimmed.length % 4 === 0) {
      info.push(`- **Looks like:** Base64`);
    }
    if (/^eyJ[A-Za-z0-9_-]+\./.test(trimmed)) {
      info.push(`- **Looks like:** JWT token`);
    }
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed)) {
      info.push(`- **Looks like:** UUID`);
    }
    if (/^https?:\/\//.test(trimmed)) {
      info.push(`- **Looks like:** URL`);
    }
    if (/^\d{10,13}$/.test(trimmed)) {
      info.push(`- **Looks like:** Unix timestamp`);
    }

    // Character frequency (top 10)
    const freq: Record<string, number> = {};
    for (const c of trimmed) {
      freq[c] = (freq[c] || 0) + 1;
    }
    const topChars = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    info.push("");
    info.push(`### Top Characters`);
    info.push(`| Char | Count |`);
    info.push(`|------|-------|`);
    for (const [char, count] of topChars) {
      const display = char === " " ? "␣" : char === "\t" ? "↹" : char === "\n" ? "↵" : char;
      info.push(`| ${display} | ${count} |`);
    }

    // Show first 500 chars as preview
    info.push("");
    info.push(`### Content Preview`);
    info.push("```");
    info.push(trimmed.substring(0, 500) + (trimmed.length > 500 ? "..." : ""));
    info.push("```");

    return info.join("\n");
  }, []);

  return <Detail isLoading={isLoading} markdown={data || "No content in clipboard"} navigationTitle="String Inspector" />;
}
