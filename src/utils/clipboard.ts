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

type ClipboardTransform = (text: string) => string | Promise<string>;

interface ClipboardCommandOptions {
  transform: ClipboardTransform;
  success: string;
  failure: string;
  fallbackMessage?: string;
}

/** Run the common read → transform → copy flow used by no-view commands. */
export async function runClipboardCommand({
  transform,
  success,
  failure,
  fallbackMessage = "Check the clipboard content",
}: ClipboardCommandOptions): Promise<void> {
  const text = await readClipboard();
  if (text === null) return;

  try {
    await copyToClipboard(await transform(text), success);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: failure,
      message: error instanceof Error ? error.message : fallbackMessage,
    });
  }
}
