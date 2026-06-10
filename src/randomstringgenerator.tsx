import { Action, ActionPanel, Form, Detail, showToast, Toast, Clipboard } from "@raycast/api";
import { randomBytes } from "crypto";
import { useState } from "react";

export default function Command() {
  const [result, setResult] = useState<string | null>(null);

  function generate(values: { length: string; charset: string; count: string }) {
    const length = parseInt(values.length) || 16;
    const count = parseInt(values.count) || 1;

    let charset = "";
    switch (values.charset) {
      case "alphanumeric":
        charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        break;
      case "letters":
        charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        break;
      case "lowercase":
        charset = "abcdefghijklmnopqrstuvwxyz";
        break;
      case "uppercase":
        charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        break;
      case "numeric":
        charset = "0123456789";
        break;
      case "hex":
        charset = "0123456789abcdef";
        break;
      case "password":
        charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        break;
      default:
        charset = values.charset;
    }

    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      let str = "";
      const bytes = randomBytes(length);
      for (let j = 0; j < length; j++) {
        str += charset[bytes[j] % charset.length];
      }
      results.push(str);
    }

    const output = results.join("\n");
    setResult(
      [
        `## Random Strings`,
        "",
        `**Charset:** ${values.charset}`,
        `**Length:** ${length}`,
        `**Count:** ${count}`,
        "",
        "```",
        output,
        "```",
      ].join("\n")
    );

    Clipboard.copy(output);
    showToast({ style: Toast.Style.Success, title: `Generated ${count} string(s) and copied to clipboard` });
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
          <Action.SubmitForm title="Generate" onSubmit={(values) => generate(values as { length: string; charset: string; count: string })} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="charset" title="Charset" defaultValue="alphanumeric">
        <Form.Dropdown.Item value="alphanumeric" title="Alphanumeric (A-Z, a-z, 0-9)" />
        <Form.Dropdown.Item value="letters" title="Letters (A-Z, a-z)" />
        <Form.Dropdown.Item value="lowercase" title="Lowercase (a-z)" />
        <Form.Dropdown.Item value="uppercase" title="Uppercase (A-Z)" />
        <Form.Dropdown.Item value="numeric" title="Numeric (0-9)" />
        <Form.Dropdown.Item value="hex" title="Hex (0-9, a-f)" />
        <Form.Dropdown.Item value="password" title="Password (special chars)" />
      </Form.Dropdown>
      <Form.TextField id="length" title="Length" defaultValue="16" />
      <Form.TextField id="count" title="Count" defaultValue="1" />
    </Form>
  );
}
