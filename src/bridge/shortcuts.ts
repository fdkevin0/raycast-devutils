import { execFile } from "node:child_process";

import { MAX_BUFFER_BYTES, SHORTCUT_NAME, TARGET_LANGUAGE, TRANSLATION_TIMEOUT_MS } from "../constants.ts";
import { TranslationError } from "../errors.ts";

const APPLE_SCRIPT = `
on run argv
  if (count of argv) is less than 2 then
    error "Missing shortcut name or source text"
  end if

  set shortcutName to item 1 of argv
  set sourceText to item 2 of argv

  tell application "Shortcuts Events"
    set translatedText to run shortcut shortcutName with input sourceText
    return translatedText as text
  end tell
end run
`;

export interface TranslationRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  signal?: AbortSignal;
}

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
}

export interface TranslationBridge {
  translate(request: TranslationRequest): Promise<TranslationResult>;
}

interface ExecutorOptions {
  timeout: number;
  maxBuffer: number;
  encoding: "utf8";
  windowsHide: boolean;
  signal?: AbortSignal;
}

interface ExecutorResult {
  stdout: string;
  stderr: string;
}

export type BridgeExecutor = (
  executable: string,
  args: readonly string[],
  options: ExecutorOptions,
) => Promise<ExecutorResult>;

export function createShortcutsTranslationBridge(executor: BridgeExecutor = executeFile): TranslationBridge {
  return {
    async translate(request) {
      if (request.targetLanguage !== TARGET_LANGUAGE) {
        throw new TranslationError(
          "UNSUPPORTED_TARGET_LANGUAGE",
          `This version supports only Simplified Chinese (${TARGET_LANGUAGE}).`,
        );
      }

      let result: ExecutorResult;
      try {
        result = await executor("/usr/bin/osascript", ["-e", APPLE_SCRIPT, SHORTCUT_NAME, request.text], {
          timeout: TRANSLATION_TIMEOUT_MS,
          maxBuffer: MAX_BUFFER_BYTES,
          encoding: "utf8",
          windowsHide: true,
          signal: request.signal,
        });
      } catch (error) {
        throw classifyExecutionError(error, request.text);
      }

      const translatedText = result.stdout.trim();
      if (!translatedText) {
        throw new TranslationError(
          "EMPTY_TRANSLATION_RESULT",
          "The Shortcut completed without returning text. Verify that its final action is Stop and Output.",
          { stderr: redactSourceText(result.stderr, request.text) },
        );
      }

      return { translatedText };
    },
  };
}

const executeFile: BridgeExecutor = (executable, args, options) =>
  new Promise((resolve, reject) => {
    execFile(executable, [...args], options, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { stderr }));
        return;
      }
      resolve({ stdout, stderr });
    });
  });

function classifyExecutionError(error: unknown, sourceText: string): TranslationError {
  const details = getExecutionErrorDetails(error);
  const combined = `${details.message}\n${details.stderr}`;
  const diagnostic = { exitCode: details.code, stderr: redactSourceText(details.stderr, sourceText) };

  if (details.code === "ETIMEDOUT" || details.killed || /timed?\s*out/i.test(combined)) {
    return new TranslationError(
      "TIMEOUT",
      `System translation timed out. Run “${SHORTCUT_NAME}” manually in Shortcuts to check for a download or permission prompt, then retry later.`,
      diagnostic,
    );
  }
  if (/-1743|not authorized|not permitted|automation.*denied/i.test(combined)) {
    return new TranslationError(
      "AUTOMATION_DENIED",
      "Raycast cannot control Shortcuts Events. Open System Settings → Privacy & Security → Automation → Raycast and enable Shortcuts Events.",
      diagnostic,
    );
  }
  if (/shortcut.*(?:not found|not be found|does not exist|doesn.t exist|can.t get|unknown)/i.test(combined)) {
    return new TranslationError(
      "MISSING_SHORTCUT",
      `The “${SHORTCUT_NAME}” Shortcut was not found. Create or install it according to the README and keep its name unchanged.`,
      diagnostic,
    );
  }

  return new TranslationError(
    "SYSTEM_ERROR",
    "macOS system translation failed. Check the diagnostic information, verify the Shortcut in the Shortcuts app, and try again.",
    diagnostic,
  );
}

function redactSourceText(value: string, sourceText: string): string {
  return sourceText ? value.split(sourceText).join("[source text redacted]") : value;
}

function getExecutionErrorDetails(error: unknown): {
  message: string;
  code?: string | number;
  stderr: string;
  killed: boolean;
} {
  if (!(error instanceof Error)) return { message: String(error), stderr: "", killed: false };
  const value = error as Error & { code?: string | number; stderr?: unknown; killed?: boolean };
  return {
    message: value.message,
    code: value.code,
    stderr: typeof value.stderr === "string" ? value.stderr : "",
    killed: value.killed === true,
  };
}
