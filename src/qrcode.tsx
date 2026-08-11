import { Action, ActionPanel, Form, Detail, showToast, Toast, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";
import * as QRCode from "qrcode";

export default function Command() {
  const { data: clipboardText, isLoading } = usePromise(async () => {
    return (await Clipboard.readText()) || "";
  }, []);

  const [result, setResult] = useState<string | null>(null);

  async function generateQR(text: string, size: number) {
    if (!text) {
      showToast({ style: Toast.Style.Failure, title: "No text provided" });
      return;
    }

    try {
      const svg = await QRCode.toString(text, {
        type: "svg",
        width: size,
        margin: 2,
        color: { dark: "#000", light: "#fff" },
      });

      // Encode SVG as data URI for markdown image
      const encoded = Buffer.from(svg).toString("base64");
      const dataUri = `data:image/svg+xml;base64,${encoded}`;

      setResult(
        [
          `## QR Code`,
          "",
          `**Content:** \`${text.length > 100 ? text.substring(0, 100) + "..." : text}\``,
          "",
          `![QR Code](${dataUri})`,
          "",
          `**Size:** ${size}px`,
        ].join("\n"),
      );

      // Also copy the text content
      Clipboard.copy(text);
      showToast({ style: Toast.Style.Success, title: "QR Code generated" });
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Could not generate QR code", message: String(error) });
    }
  }

  if (result) {
    return (
      <Detail
        markdown={result}
        actions={
          <ActionPanel>
            <Action title="Back" onAction={() => setResult(null)} />
            <Action.CopyToClipboard title="Copy Text" content={result} />
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
            title="Generate QR Code"
            onSubmit={(values) => {
              const vals = values as { text: string; size: string };
              generateQR(vals.text, parseInt(vals.size) || 256);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="text"
        title="Text"
        placeholder="Text to encode as QR code..."
        defaultValue={clipboardText || ""}
      />
      <Form.Dropdown id="size" title="Size" defaultValue="256">
        <Form.Dropdown.Item value="128" title="128px" />
        <Form.Dropdown.Item value="256" title="256px" />
        <Form.Dropdown.Item value="512" title="512px" />
      </Form.Dropdown>
    </Form>
  );
}
