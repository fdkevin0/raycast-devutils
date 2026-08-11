import { MAX_INPUT_CHARACTERS } from "../constants.ts";
import { TranslationError } from "../errors.ts";

export interface InputReaders {
  getSelectedText(): Promise<string>;
  readClipboardText(): Promise<string | undefined>;
}

export async function resolveInput(argument: string | undefined, readers: InputReaders): Promise<string> {
  const argumentText = argument?.trim();
  if (argumentText) return validateInput(argumentText);

  let selectedText: string | undefined;
  try {
    selectedText = (await readers.getSelectedText()).trim();
  } catch {
    // Selection capture is optional; clipboard remains available without Accessibility permission.
  }

  if (selectedText) return validateInput(selectedText);

  const clipboardText = (await readers.readClipboardText())?.trim();
  if (clipboardText) return validateInput(clipboardText);

  throw new TranslationError(
    "NO_INPUT",
    "No text was found. Select text, copy text to the clipboard, or pass text to the command.",
  );
}

function validateInput(text: string): string {
  if (Array.from(text).length > MAX_INPUT_CHARACTERS) {
    throw new TranslationError(
      "INPUT_TOO_LARGE",
      `The input is longer than the ${MAX_INPUT_CHARACTERS.toLocaleString()} character limit. Shorten it and try again.`,
    );
  }
  return text;
}
