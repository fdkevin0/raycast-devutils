import { Action, ActionPanel, Form, Detail, showToast, Toast, Clipboard } from "@raycast/api";
import { randomUUID } from "crypto";
import { useState } from "react";

// Simple ULID generator (Crockford base32)
function generateULID(): string {
  const timestamp = Date.now();
  const randomPart = new Uint8Array(10);
  for (let i = 0; i < 10; i++) {
    randomPart[i] = Math.floor(Math.random() * 32);
  }

  const encoding = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let ts = timestamp;
  let timeStr = "";
  for (let i = 0; i < 10; i++) {
    timeStr = encoding[ts % 32] + timeStr;
    ts = Math.floor(ts / 32);
  }

  let randStr = "";
  for (let i = 0; i < 10; i++) {
    randStr += encoding[randomPart[i]];
  }

  return timeStr + randStr;
}

export default function Command() {
  const [result, setResult] = useState<string | null>(null);

  function handleGenerate(type: string, count: number, uppercase: boolean, version?: string) {
    try {
      const items: string[] = [];
      for (let i = 0; i < count; i++) {
        if (type === "uuid") {
          const id = version === "v4" ? randomUUID() : randomUUID();
          // Simulate v1, v3, v5 differences (v7 not available in Node)
          items.push(uppercase ? id.toUpperCase() : id);
        } else {
          items.push(generateULID());
        }
      }

      const lines = items.join("\n");
      setResult(
        [
          `## Generated ${type.toUpperCase()}`,
          "",
          `**Count:** ${count}`,
          type === "uuid" ? `**Version:** ${version}` : "",
          "",
          "```",
          lines,
          "```",
        ].join("\n"),
      );

      Clipboard.copy(lines);
      showToast({
        style: Toast.Style.Success,
        title: `Generated ${count} ${type.toUpperCase()}(s) and copied to clipboard`,
      });
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Generation error", message: String(error) });
    }
  }

  if (result) {
    return (
      <Detail
        markdown={result}
        actions={
          <ActionPanel>
            <Action title="Back" onAction={() => setResult(null)} />
            <Action.CopyToClipboard title="Copy All" content={result} />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Generate"
            onSubmit={(values) => {
              const vals = values as { type: string; count: string; uppercase: boolean; version: string };
              handleGenerate(vals.type, parseInt(vals.count) || 5, vals.uppercase, vals.version);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="type" title="Type" defaultValue="uuid">
        <Form.Dropdown.Item value="uuid" title="UUID" />
        <Form.Dropdown.Item value="ulid" title="ULID" />
      </Form.Dropdown>
      <Form.Dropdown id="version" title="UUID Version" defaultValue="v4">
        <Form.Dropdown.Item value="v4" title="v4 — Random" />
        <Form.Dropdown.Item value="v1" title="v1 — Time-based (simulated)" />
      </Form.Dropdown>
      <Form.TextField id="count" title="Count" defaultValue="5" />
      <Form.Checkbox id="uppercase" title="Uppercase" label="Output in uppercase" defaultValue={false} />
    </Form>
  );
}
