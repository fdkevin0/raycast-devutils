import { runClipboardCommand } from "./utils/clipboard";
import { format } from "sql-formatter";

export default async function Command() {
  await runClipboardCommand({
    transform: (text) =>
      format(text, {
        language: "sql",
        tabWidth: 2,
        keywordCase: "upper",
        linesBetweenQueries: 2,
      }),
    success: "SQL formatted",
    failure: "Could not format SQL",
    fallbackMessage: "Invalid SQL",
  });
}
