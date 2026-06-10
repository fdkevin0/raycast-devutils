import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    // ERB is essentially HTML, so format the HTML parts using prettier
    const prettier = await import("prettier");
    // Replace ERB tags with placeholders, format HTML, then restore
    const erbTags: string[] = [];
    const withPlaceholders = text.replace(/<%=?(.+?)%>/g, (match) => {
      erbTags.push(match);
      return `__ERB_${erbTags.length - 1}__`;
    });

    const formatted = await prettier.format(withPlaceholders, {
      parser: "html",
      printWidth: 80,
      tabWidth: 2,
    });

    // Restore ERB tags
    const restored = formatted.replace(/__ERB_(\d+)__/g, (_, i) => erbTags[parseInt(i)]);

    await copyToClipboard(restored, "ERB formatted");
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not format ERB",
      message: "Check the clipboard content",
    });
  }
}
