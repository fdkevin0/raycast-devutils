import { Action, ActionPanel, Clipboard, Detail, environment, getSelectedText, type LaunchProps } from "@raycast/api";
import { release } from "node:os";
import { useEffect, useMemo, useState } from "react";

import { createShortcutsTranslationBridge } from "./bridge/shortcuts";
import { TARGET_LANGUAGE } from "./constants";
import { formatDiagnosticInformation } from "./diagnostics";
import { TranslationError } from "./errors";
import { resolveInput } from "./input/resolve-input";

type Arguments = { text?: string };

type State =
  | { status: "loading" }
  | { status: "success"; source: string; translated: string }
  | { status: "error"; error: TranslationError };

const bridge = createShortcutsTranslationBridge();

export default function Command(props: LaunchProps<{ arguments: Arguments }>) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    async function run() {
      try {
        const source = await resolveInput(props.arguments.text, {
          getSelectedText,
          readClipboardText: () => Clipboard.readText(),
        });
        const result = await bridge.translate({
          text: source,
          targetLanguage: TARGET_LANGUAGE,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setState({ status: "success", source, translated: result.translatedText });
        }
      } catch (error) {
        if (!controller.signal.aborted) setState({ status: "error", error: normalizeError(error) });
      }
    }

    void run();
    return () => controller.abort();
  }, [attempt, props.arguments.text]);

  if (state.status === "loading") {
    return <Detail isLoading markdown="Invoking macOS system translation…" />;
  }

  if (state.status === "error") {
    return <ErrorDetail error={state.error} retry={() => setAttempt((value) => value + 1)} />;
  }

  return (
    <Detail
      markdown={asPlainTextMarkdown(state.translated)}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Translation" content={state.translated} />
          <Action.Paste title="Paste Translation" content={state.translated} />
          <Action.CopyToClipboard
            title="Copy Source Text"
            content={state.source}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

function ErrorDetail({ error, retry }: { error: TranslationError; retry(): void }) {
  const diagnostic = useMemo(
    () =>
      formatDiagnosticInformation(error, {
        darwinKernelVersion: release(),
        raycastVersion: environment.raycastVersion,
      }),
    [error],
  );

  return (
    <Detail
      markdown={`## Translation Failed\n\n${error.message}`}
      actions={
        <ActionPanel>
          <Action title="Retry" onAction={retry} />
          {(error.code === "MISSING_SHORTCUT" || error.code === "TIMEOUT" || error.code === "SYSTEM_ERROR") && (
            <Action.Open title="Open Shortcuts" target="shortcuts://" />
          )}
          {error.code === "SYSTEM_ERROR" && (
            <Action.CopyToClipboard title="Copy Diagnostic Information" content={diagnostic} />
          )}
        </ActionPanel>
      }
    />
  );
}

function normalizeError(error: unknown): TranslationError {
  if (error instanceof TranslationError) return error;
  return new TranslationError(
    "SYSTEM_ERROR",
    "macOS system translation failed. Open the Shortcuts app, verify the Shortcut, and try again.",
  );
}

function asPlainTextMarkdown(text: string): string {
  return `<pre>${text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>`;
}
