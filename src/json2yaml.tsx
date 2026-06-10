import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";
import * as yaml from "js-yaml";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const data = JSON.parse(text);
    const yamlStr = yaml.dump(data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });
    await copyToClipboard(yamlStr, "JSON → YAML");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not convert JSON to YAML",
      message: error instanceof Error ? error.message : "Invalid JSON",
    });
  }
}
