import assert from "node:assert/strict";
import test from "node:test";

import { formatDiagnosticInformation } from "./diagnostics.ts";
import { TranslationError } from "./errors.ts";

test("copyable diagnostic information never includes stderr text", () => {
  const error = new TranslationError("SYSTEM_ERROR", "Translation failed", {
    exitCode: 1,
    stderr: "private source fragment",
  });

  const diagnostic = formatDiagnosticInformation(error, {
    darwinKernelVersion: "test-kernel",
    raycastVersion: "test-raycast",
  });

  assert.doesNotMatch(diagnostic, /private source fragment/);
  assert.match(diagnostic, /Error category: SYSTEM_ERROR/);
  assert.match(diagnostic, /Exit code: 1/);
});
