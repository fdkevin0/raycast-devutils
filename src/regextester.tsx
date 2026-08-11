import { Action, ActionPanel, Form, Detail, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";

export default function Command() {
  const { data: clipboardText, isLoading } = usePromise(async () => {
    return (await Clipboard.readText()) || "";
  }, []);

  const [showResult, setShowResult] = useState(false);
  const [resultMarkdown, setResultMarkdown] = useState("");
  const [lastValues, setLastValues] = useState<{ pattern: string; testString: string; flags: string[] } | null>(null);

  function buildResult(values: { pattern: string; testString: string; flags: string[] }) {
    const { pattern, testString, flags } = values;

    if (!pattern) {
      setResultMarkdown("## Error\n\nPlease enter a regular expression pattern.");
      setShowResult(true);
      return;
    }

    try {
      const flagStr = flags.join("");
      const regex = new RegExp(pattern, flagStr);
      const matches = Array.from(testString.matchAll(regex));

      if (matches.length === 0) {
        setResultMarkdown(
          `## RegExp Results\n\n**Pattern:** \`/${pattern}/${flagStr}\`\n\n**Test string:**\n\`\`\`\n${testString}\n\`\`\`\n\nNo matches found.`,
        );
        setShowResult(true);
        return;
      }

      let output = `## RegExp Results\n\n`;
      output += `**Pattern:** \`/${pattern}/${flagStr}\`\n\n`;
      output += `**Matches:** ${matches.length}\n\n`;

      for (let i = 0; i < Math.min(matches.length, 50); i++) {
        const match = matches[i];
        output += `### Match ${i + 1}\n`;
        output += `- Full: \`${match[0]}\` at index ${match.index}\n`;
        for (let g = 1; g < match.length; g++) {
          output += `- Group ${g}: \`${match[g] || "(empty)"}\`\n`;
        }
        if (match.groups) {
          for (const [name, val] of Object.entries(match.groups)) {
            if (val !== undefined) {
              output += `- \`${name}\`: \`${val}\`\n`;
            }
          }
        }
        output += "\n";
      }

      if (matches.length > 50) {
        output += `\n... and ${matches.length - 50} more matches\n`;
      }

      setResultMarkdown(output);
      setShowResult(true);
    } catch (error) {
      setResultMarkdown(`## Error\n\nInvalid regex: \`${error instanceof Error ? error.message : String(error)}\``);
      setShowResult(true);
    }
  }

  if (showResult) {
    return (
      <Detail
        markdown={resultMarkdown}
        actions={
          <ActionPanel>
            <Action title="Edit Regex" onAction={() => setShowResult(false)} />
            <Action.CopyToClipboard title="Copy Results" content={resultMarkdown} />
          </ActionPanel>
        }
      />
    );
  }

  const defaultFlags = lastValues?.flags || ["g"];

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Test Regex"
            onSubmit={(values) => {
              const vals = values as { pattern: string; testString: string; flags: string[] };
              setLastValues(vals);
              // Also restore the form values by setting defaults implicitly
              buildResult(vals);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="pattern" title="Pattern" placeholder="/regex/" defaultValue={lastValues?.pattern} />
      <Form.TextArea
        id="testString"
        title="Test String"
        placeholder="String to test against..."
        defaultValue={lastValues?.testString || clipboardText}
      />
      <Form.TagPicker id="flags" title="Flags" defaultValue={defaultFlags}>
        <Form.TagPicker.Item value="g" title="g — Global" />
        <Form.TagPicker.Item value="i" title="i — Case Insensitive" />
        <Form.TagPicker.Item value="m" title="m — Multiline" />
        <Form.TagPicker.Item value="s" title="s — Dot All" />
        <Form.TagPicker.Item value="u" title="u — Unicode" />
      </Form.TagPicker>
    </Form>
  );
}
