import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";
import { format } from "sql-formatter";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const formatted = format(text, {
      language: "sql",
      tabWidth: 2,
      keywordCase: "upper",
      linesBetweenQueries: 2,
    });
    await copyToClipboard(formatted, "SQL formatted");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not format SQL",
      message: error instanceof Error ? error.message : "Invalid SQL",
    });
  }
}
