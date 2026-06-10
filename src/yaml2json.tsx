import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";
import * as yaml from "js-yaml";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const data = yaml.load(text);
    const json = JSON.stringify(data, null, 2);
    await copyToClipboard(json, "YAML → JSON");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not convert YAML to JSON",
      message: error instanceof Error ? error.message : "Invalid YAML",
    });
  }
}
