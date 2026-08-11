import { Action, ActionPanel, Form, Detail, showToast, Toast, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";
import * as Diff from "diff";

export default function Command() {
  const { data: clipboardText, isLoading } = usePromise(async () => {
    return (await Clipboard.readText()) || "";
  }, []);

  const [result, setResult] = useState<string | null>(null);

  function computeDiff(text1: string, text2: string, diffType: string) {
    if (!text1 && !text2) {
      showToast({ style: Toast.Style.Failure, title: "Both texts are empty" });
      return;
    }

    let diffs: Diff.Change[];
    let label = "";

    switch (diffType) {
      case "chars":
        diffs = Diff.diffChars(text1, text2);
        label = "Character diff";
        break;
      case "words":
        diffs = Diff.diffWords(text1, text2);
        label = "Word diff";
        break;
      case "lines":
      default:
        diffs = Diff.diffLines(text1, text2);
        label = "Line diff";
        break;
    }

    let output = `## Text Diff (${label})\n\n`;

    // Statistics
    const added = diffs.filter((d) => d.added).length;
    const removed = diffs.filter((d) => d.removed).length;
    output += `**Changes:** `;
    if (removed > 0) output += `${removed} removed, `;
    if (added > 0) output += `${added} added`;
    if (added === 0 && removed === 0) output += "None (texts are identical)";
    output += "\n\n";

    // Render diff
    output += "```diff\n";
    for (const part of diffs) {
      if (part.added) {
        for (const line of part.value.split("\n")) {
          if (line) output += `+ ${line}\n`;
        }
      } else if (part.removed) {
        for (const line of part.value.split("\n")) {
          if (line) output += `- ${line}\n`;
        }
      } else {
        for (const line of part.value.split("\n")) {
          if (line) output += `  ${line}\n`;
        }
      }
    }
    output += "```\n";

    setResult(output);
  }

  if (result) {
    return (
      <Detail
        markdown={result}
        actions={
          <ActionPanel>
            <Action title="Back" onAction={() => setResult(null)} />
            <Action.CopyToClipboard title="Copy Results" content={result} />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Compare Texts"
            onSubmit={(values) => {
              const vals = values as { text1: string; text2: string; diffType: string };
              computeDiff(vals.text1, vals.text2, vals.diffType);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="text1"
        title="Text 1 (Original)"
        placeholder="Original text..."
        defaultValue={clipboardText || ""}
      />
      <Form.TextArea id="text2" title="Text 2 (Modified)" placeholder="Modified text..." />
      <Form.Dropdown id="diffType" title="Diff Type" defaultValue="lines">
        <Form.Dropdown.Item value="lines" title="Lines" />
        <Form.Dropdown.Item value="words" title="Words" />
        <Form.Dropdown.Item value="chars" title="Characters" />
      </Form.Dropdown>
    </Form>
  );
}
