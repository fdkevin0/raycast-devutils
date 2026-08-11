import { TranslationError } from "./errors.ts";

interface DiagnosticMetadata {
  darwinKernelVersion: string;
  raycastVersion?: string;
  extensionVersion?: string;
}

export function formatDiagnosticInformation(error: TranslationError, metadata: DiagnosticMetadata): string {
  return [
    `Darwin kernel: ${metadata.darwinKernelVersion}`,
    metadata.raycastVersion ? `Raycast: ${metadata.raycastVersion}` : undefined,
    metadata.extensionVersion ? `Extension: ${metadata.extensionVersion}` : undefined,
    `Error category: ${error.code}`,
    error.diagnostic?.exitCode !== undefined ? `Exit code: ${error.diagnostic.exitCode}` : undefined,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}
