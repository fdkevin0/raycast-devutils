import assert from "node:assert/strict";
import test from "node:test";

import { resolveInput } from "./resolve-input.ts";

test("command argument takes priority over selection and clipboard", async () => {
  let selectionRead = false;
  let clipboardRead = false;

  const result = await resolveInput("  from argument  ", {
    getSelectedText: async () => {
      selectionRead = true;
      return "from selection";
    },
    readClipboardText: async () => {
      clipboardRead = true;
      return "from clipboard";
    },
  });

  assert.equal(result, "from argument");
  assert.equal(selectionRead, false);
  assert.equal(clipboardRead, false);
});

test("selection failure falls back to clipboard", async () => {
  const result = await resolveInput(undefined, {
    getSelectedText: async () => {
      throw new Error("Accessibility denied");
    },
    readClipboardText: async () => "  from clipboard  ",
  });

  assert.equal(result, "from clipboard");
});

test("blank input from every source is rejected", async () => {
  await assert.rejects(
    resolveInput("  ", {
      getSelectedText: async () => "\n",
      readClipboardText: async () => undefined,
    }),
    { code: "NO_INPUT" },
  );
});

test("input over 20,000 Unicode characters is rejected", async () => {
  await assert.rejects(
    resolveInput("😀".repeat(20_001), {
      getSelectedText: async () => "unused",
      readClipboardText: async () => "unused",
    }),
    { code: "INPUT_TOO_LARGE" },
  );
});
