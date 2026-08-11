import { runClipboardCommand } from "./utils/clipboard";
import * as yaml from "js-yaml";

export default async function Command() {
  await runClipboardCommand({
    transform: (text) => JSON.stringify(yaml.load(text), null, 2),
    success: "YAML → JSON",
    failure: "Could not convert YAML to JSON",
    fallbackMessage: "Invalid YAML",
  });
}
