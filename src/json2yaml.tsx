import { runClipboardCommand } from "./utils/clipboard";
import * as yaml from "js-yaml";

export default async function Command() {
  await runClipboardCommand({
    transform: (text) =>
      yaml.dump(JSON.parse(text), {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      }),
    success: "JSON → YAML",
    failure: "Could not convert JSON to YAML",
    fallbackMessage: "Invalid JSON",
  });
}
