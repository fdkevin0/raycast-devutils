import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const trimmed = text.trim();

    // Try to detect the input format
    let value: number;

    if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
      value = parseInt(trimmed, 16);
    } else if (/^0b[01]+$/.test(trimmed)) {
      value = parseInt(trimmed.substring(2), 2);
    } else if (/^0o[0-7]+$/i.test(trimmed)) {
      value = parseInt(trimmed.substring(2), 8);
    } else if (/^[0-9]+$/.test(trimmed)) {
      value = parseInt(trimmed, 10);
    } else {
      value = Number(trimmed);
    }

    if (isNaN(value)) {
      throw new Error("Not a valid number");
    }

    const result = [
      `Decimal: ${value}`,
      `Hexadecimal: 0x${value.toString(16).toUpperCase()}`,
      `Binary: 0b${value.toString(2)}`,
      `Octal: 0o${value.toString(8)}`,
      `Scientific: ${value.toExponential()}`,
    ].join("\n");

    await copyToClipboard(result, "Number bases converted");
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not convert number",
      message: "Make sure clipboard contains a valid number",
    });
  }
}
