import assert from "node:assert/strict";
import test from "node:test";

import { SHORTCUT_NAME } from "../constants.ts";
import { TranslationError } from "../errors.ts";
import { createShortcutsTranslationBridge, type BridgeExecutor } from "./shortcuts.ts";

test("returns trimmed output while passing source text as a separate osascript argument", async () => {
  const source = 'He said "hello".\\path\nEmoji: 👋; $(touch nope)';
  let invocation: Parameters<BridgeExecutor> | undefined;
  const executor: BridgeExecutor = async (...parameters) => {
    invocation = parameters;
    return { stdout: "  你好 👋\n", stderr: "" };
  };

  const result = await createShortcutsTranslationBridge(executor).translate({
    text: source,
    targetLanguage: "zh-Hans",
  });

  assert.equal(result.translatedText, "你好 👋");
  assert.equal(invocation?.[0], "/usr/bin/osascript");
  assert.equal(invocation?.[1].at(-2), SHORTCUT_NAME);
  assert.equal(invocation?.[1].at(-1), source);
  assert.doesNotMatch(invocation?.[1][1] ?? "", /He said|touch nope/);
});

test("empty output becomes a typed error", async () => {
  const executor: BridgeExecutor = async () => ({ stdout: " \n", stderr: "" });

  await assert.rejects(
    createShortcutsTranslationBridge(executor).translate({ text: "hello", targetLanguage: "zh-Hans" }),
    { code: "EMPTY_TRANSLATION_RESULT" },
  );
});

test("a killed process becomes a timeout error", async () => {
  const executor: BridgeExecutor = async () => {
    throw Object.assign(new Error("command failed"), { killed: true, stderr: "" });
  };

  await assert.rejects(
    createShortcutsTranslationBridge(executor).translate({ text: "hello", targetLanguage: "zh-Hans" }),
    { code: "TIMEOUT" },
  );
});

test("missing Shortcut errors are recognized", async () => {
  const executor: BridgeExecutor = async () => {
    throw Object.assign(new Error("execution error"), { stderr: "The shortcut was not found." });
  };

  await assert.rejects(
    createShortcutsTranslationBridge(executor).translate({ text: "hello", targetLanguage: "zh-Hans" }),
    { code: "MISSING_SHORTCUT" },
  );
});

test("Automation denial errors are recognized", async () => {
  const executor: BridgeExecutor = async () => {
    throw Object.assign(new Error("Not authorized to send Apple events. (-1743)"), { code: 1 });
  };

  await assert.rejects(
    createShortcutsTranslationBridge(executor).translate({ text: "hello", targetLanguage: "zh-Hans" }),
    { code: "AUTOMATION_DENIED" },
  );
});

test("unsupported target languages fail explicitly", async () => {
  const executor: BridgeExecutor = async () => ({ stdout: "unused", stderr: "" });

  await assert.rejects(createShortcutsTranslationBridge(executor).translate({ text: "hello", targetLanguage: "en" }), {
    code: "UNSUPPORTED_TARGET_LANGUAGE",
  });
});

test("diagnostic output excludes source text", async () => {
  const source = "private source text";
  const executor: BridgeExecutor = async () => {
    throw Object.assign(new Error(`failed for ${source}`), {
      code: 1,
      stderr: `system error while translating ${source}`,
    });
  };

  const error = (await createShortcutsTranslationBridge(executor)
    .translate({ text: source, targetLanguage: "zh-Hans" })
    .catch((caught: unknown) => caught)) as TranslationError;

  assert.doesNotMatch(JSON.stringify(error.diagnostic), new RegExp(source));
});
