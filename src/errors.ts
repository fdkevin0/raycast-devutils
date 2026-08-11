export type TranslationErrorCode =
  | "NO_INPUT"
  | "INPUT_TOO_LARGE"
  | "EMPTY_TRANSLATION_RESULT"
  | "MISSING_SHORTCUT"
  | "AUTOMATION_DENIED"
  | "TIMEOUT"
  | "UNSUPPORTED_TARGET_LANGUAGE"
  | "SYSTEM_ERROR";

export class TranslationError extends Error {
  public readonly code: TranslationErrorCode;
  public readonly diagnostic?: Readonly<{ exitCode?: string | number; stderr?: string }>;

  constructor(
    code: TranslationErrorCode,
    message: string,
    diagnostic?: Readonly<{ exitCode?: string | number; stderr?: string }>,
  ) {
    super(message);
    this.name = "TranslationError";
    this.code = code;
    this.diagnostic = diagnostic;
  }
}
