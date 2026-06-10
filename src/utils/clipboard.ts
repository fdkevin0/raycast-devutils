import { Clipboard, showHUD, showToast, Toast } from "@raycast/api";

/**
 * Read text from clipboard and return it, or show a failure toast if empty.
 */
export async function readClipboard(): Promise<string | null> {
  const text = await Clipboard.readText();
  if (!text || text.trim().length === 0) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Clipboard is empty",
      message: "Copy some text first",
    });
    return null;
  }
  return text;
}

/**
 * Copy text to clipboard and show a HUD message.
 */
export async function copyToClipboard(text: string, label?: string): Promise<void> {
  await Clipboard.copy(text);
  await showHUD(label || "Copied to clipboard");
}

/**
 * Paste text directly (replaces clipboard and pastes into frontmost app).
 */
export async function pasteText(text: string): Promise<void> {
  await Clipboard.paste(text);
}

/**
 * Show a success HUD, or a failure toast if message is null.
 */
export async function showResult(result: string | null, successLabel?: string): Promise<void> {
  if (result === null) {
    return; // Error already shown by readClipboard or processing
  }
  await copyToClipboard(result, successLabel);
}
