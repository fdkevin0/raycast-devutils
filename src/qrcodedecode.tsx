import { Action, ActionPanel, Form, Detail, showToast, Toast, Clipboard, getPreferenceValues } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { exec } from "child_process";
import { promisify } from "util";
import { useState } from "react";
import { Jimp } from "jimp";
import jsQR from "jsqr";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

interface DecodeResult {
  content: string;
  imagePath: string;
  error?: string;
}

export default function Command() {
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastImagePath, setLastImagePath] = useState<string | null>(null);

  async function takeScreenshot(): Promise<string> {
    const tmpPath = path.join(os.tmpdir(), `qrcode-scan-${Date.now()}.png`);

    // Ensure PATH includes common locations
    const env = {
      ...process.env,
      PATH: [process.env.PATH, "/usr/sbin", "/usr/bin", "/sbin", "/bin"].filter(Boolean).join(":"),
    };

    try {
      // -i: interactive selection, -s: selection mode (no window chrome)
      await execAsync(`screencapture -i -s "${tmpPath}"`, { env, timeout: 30000 });
    } catch (error: unknown) {
      const err = error as { stderr?: string; killed?: boolean };
      if (err.killed) throw new Error("Screenshot cancelled or timed out");
      // screencapture returns non-zero on user cancel
      throw new Error("Screenshot cancelled");
    }

    // Check the file exists and has content
    try {
      await fs.promises.access(tmpPath, fs.constants.F_OK);
      const stat = await fs.promises.stat(tmpPath);
      if (stat.size === 0) throw new Error("Screenshot is empty");
    } catch {
      throw new Error("Screenshot file not found or empty");
    }

    return tmpPath;
  }

  async function decodeQrFromImage(imagePath: string): Promise<DecodeResult> {
    try {
      const image = await Jimp.read(imagePath);

      // jsQR works best with reasonably sized images; resize large ones
      const maxDim = 2048;
      if (image.bitmap.width > maxDim || image.bitmap.height > maxDim) {
        const scale = maxDim / Math.max(image.bitmap.width, image.bitmap.height);
        image.resize({ w: Math.round(image.bitmap.width * scale), h: Math.round(image.bitmap.height * scale) });
      }

      const { data, width, height } = image.bitmap;

      // Try decoding from the full image first
      let code = jsQR(new Uint8ClampedArray(data), width, height);

      // If not found, try scanning sub-regions (QR might be in a small area)
      if (!code) {
        // Try scanning the image in a sliding window approach for large images
        const windows = [
          { x: 0, y: 0, w: Math.floor(width * 0.5), h: Math.floor(height * 0.5) },
          { x: Math.floor(width * 0.5), y: 0, w: Math.floor(width * 0.5), h: Math.floor(height * 0.5) },
          { x: 0, y: Math.floor(height * 0.5), w: Math.floor(width * 0.5), h: Math.floor(height * 0.5) },
          { x: Math.floor(width * 0.5), y: Math.floor(height * 0.5), w: Math.floor(width * 0.5), h: Math.floor(height * 0.5) },
        ];

        for (const win of windows) {
          const region = new Uint8ClampedArray(win.w * win.h * 4);
          for (let row = 0; row < win.h; row++) {
            const srcStart = ((win.y + row) * width + win.x) * 4;
            const dstStart = row * win.w * 4;
            region.set(data.subarray(srcStart, srcStart + win.w * 4), dstStart);
          }
          code = jsQR(region, win.w, win.h);
          if (code) break;
        }
      }

      if (!code) {
        return {
          content: "",
          imagePath,
          error: "No QR code found in the image. Make sure the QR code is clearly visible.",
        };
      }

      return {
        content: code.data,
        imagePath,
      };
    } catch (error) {
      return {
        content: "",
        imagePath,
        error: `Failed to read image: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async function handleTakeScreenshot() {
    setIsProcessing(true);
    try {
      await showToast({ style: Toast.Style.Animated, title: "Select screen area to capture..." });
      const imagePath = await takeScreenshot();
      setLastImagePath(imagePath);
      await showToast({ style: Toast.Style.Animated, title: "Decoding QR code..." });
      const decodeResult = await decodeQrFromImage(imagePath);
      setResult(decodeResult);

      if (decodeResult.content && !decodeResult.error) {
        await Clipboard.copy(decodeResult.content);
        await showToast({ style: Toast.Style.Success, title: "QR Code decoded and copied to clipboard" });
      } else {
        await showToast({ style: Toast.Style.Failure, title: decodeResult.error || "No QR code found" });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Screenshot failed",
        message: error instanceof Error ? error.message : String(error),
      });
      setResult({
        content: "",
        imagePath: "",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleFileSubmit(values: { imageFile: string[] }) {
    setIsProcessing(true);
    try {
      const filePath = values.imageFile?.[0];
      if (!filePath) {
        await showToast({ style: Toast.Style.Failure, title: "No file selected" });
        setIsProcessing(false);
        return;
      }

      setLastImagePath(filePath);
      await showToast({ style: Toast.Style.Animated, title: "Decoding QR code..." });
      const decodeResult = await decodeQrFromImage(filePath);
      setResult(decodeResult);

      if (decodeResult.content && !decodeResult.error) {
        await Clipboard.copy(decodeResult.content);
        await showToast({ style: Toast.Style.Success, title: "QR Code decoded and copied to clipboard" });
      } else {
        await showToast({ style: Toast.Style.Failure, title: decodeResult.error || "No QR code found" });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Decode failed",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsProcessing(false);
    }
  }

  // Show results
  if (result) {
    const isSuccess = result.content && !result.error;

    const markdown = [
      `# QR Code Decoder`,
      "",
      isSuccess
        ? `✅ **Successfully decoded**`
        : `❌ **${result.error}**`,
      "",
      result.imagePath ? `**Source:** \`${path.basename(result.imagePath)}\`` : "",
      "",
      isSuccess ? "## Content" : "",
      isSuccess ? "```" : "",
      isSuccess ? result.content : "",
      isSuccess ? "```" : "",
      isSuccess ? `\n**Length:** ${result.content.length} characters` : "",
    ].join("\n");

    return (
      <Detail
        isLoading={isProcessing}
        markdown={markdown}
        actions={
          <ActionPanel>
            {isSuccess && (
              <>
                <Action.CopyToClipboard title="Copy Content" content={result.content} />
                <Action
                  title="Open as URL"
                  onAction={() => {
                    if (/^https?:\/\//i.test(result.content)) {
                      execAsync(`open "${result.content}"`).catch(() => {});
                    }
                  }}
                />
              </>
            )}
            <Action
              title="📸 Take New Screenshot"
              onAction={() => {
                setResult(null);
                handleTakeScreenshot();
              }}
            />
            <Action
              title="Back to File Selection"
              onAction={() => setResult(null)}
            />
            <Action.CopyToClipboard title="Copy Raw Markdown" content={markdown} />
          </ActionPanel>
        }
      />
    );
  }

  // Show input form
  return (
    <Form
      isLoading={isProcessing}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Decode from File"
            onSubmit={(values) => {
              handleFileSubmit(values as unknown as { imageFile: string[] });
            }}
          />
          <Action
            title="📸 Take Screenshot"
            onAction={handleTakeScreenshot}
          />
        </ActionPanel>
      }
    >
      <Form.FilePicker id="imageFile" title="Image File" allowMultipleSelection={false} />
      <Form.Description
        title="Usage"
        text="Select an image file containing a QR code, or use '📸 Take Screenshot' to capture part of your screen. The decoded content will be copied to clipboard."
      />
    </Form>
  );
}
