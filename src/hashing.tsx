import { Action, ActionPanel, Form, Detail, Clipboard, showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { createHash } from "crypto";
import { useState } from "react";

const ALGORITHMS = [
  "md5",
  "sha1",
  "sha256",
  "sha384",
  "sha512",
  "sha3-256",
  "sha3-384",
  "sha3-512",
] as const;

export default function Command() {
  const { data: clipboardText, isLoading } = usePromise(async () => {
    return (await Clipboard.readText()) || "";
  }, []);

  const [result, setResult] = useState<string | null>(null);

  function computeHash(input: string, algorithm: string) {
    try {
      const hash = createHash(algorithm).update(input).digest("hex");
      setResult(
        [
          "## Hash Result",
          "",
          `**Algorithm:** \`${algorithm.toUpperCase()}\``,
          `**Input:** \`${input.length > 200 ? input.substring(0, 200) + "..." : input}\``,
          "",
          "### Hash",
          "```",
          hash,
          "```",
        ].join("\n")
      );
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Hash error", message: String(error) });
    }
  }

  if (result) {
    return (
      <Detail
        markdown={result}
        actions={
          <ActionPanel>
            <Action title="Back" onAction={() => setResult(null)} />
            <Action.CopyToClipboard title="Copy Hash" content={result} />
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
            title="Generate Hash"
            onSubmit={(values) => {
              const vals = values as { input: string; algorithm: string };
              computeHash(vals.input, vals.algorithm);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="algorithm" title="Algorithm" defaultValue="sha256">
        {ALGORITHMS.map((alg) => (
          <Form.Dropdown.Item key={alg} value={alg} title={alg.toUpperCase()} />
        ))}
      </Form.Dropdown>
      <Form.TextArea id="input" title="Input" placeholder="Text to hash..." defaultValue={clipboardText || ""} />
    </Form>
  );
}
