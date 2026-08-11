import { runClipboardCommand } from "./utils/clipboard";

export default async function Command() {
  await runClipboardCommand({
    transform: (text) => JSON.stringify(JSON.parse(text), null, 2),
    success: "JSON formatted",
    failure: "Invalid JSON",
    fallbackMessage: "Could not parse clipboard content as JSON",
  });
}
