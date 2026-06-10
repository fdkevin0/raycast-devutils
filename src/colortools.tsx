import { Action, ActionPanel, Form, Detail, showToast, Toast, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";

function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.replace("#", "").match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export default function Command() {
  const { data: clipboardText, isLoading } = usePromise(async () => {
    return (await Clipboard.readText()) || "";
  }, []);

  const [result, setResult] = useState<string | null>(null);

  function convert(color: string) {
    const trimmed = color.trim();

    try {
      let r: number, g: number, b: number;

      // HEX
      const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
      if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        const rgb = hexToRgb(hex);
        if (rgb) [r, g, b] = rgb;
        else throw new Error("Invalid hex");
      }
      // RGB
      else if (trimmed.includes(",")) {
        const parts = trimmed.match(/[\d.]+/g);
        if (!parts || parts.length < 3) throw new Error("Invalid RGB");
        r = parseInt(parts[0]); g = parseInt(parts[1]); b = parseInt(parts[2]);
      }
      // HSL
      else if (trimmed.toLowerCase().includes("hsl")) {
        const parts = trimmed.match(/[\d.]+/g);
        if (!parts || parts.length < 3) throw new Error("Invalid HSL");
        const [hr, hg, hb] = hslToRgb(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
        r = hr; g = hg; b = hb;
      } else {
        throw new Error("Unrecognized color format");
      }

      const hex = rgbToHex(r, g, b);
      const [h, s, l] = rgbToHsl(r, g, b);

      const rgbCss = `rgb(${r}, ${g}, ${b})`;
      const hslCss = `hsl(${h}, ${s}%, ${l}%)`;

      const colorBlock = `![Color Block](data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${hex}"/></svg>`)})`;

      const markdown = [
        `## Color Converter`,
        "",
        colorBlock,
        "",
        "| Format | Value |",
        "|--------|-------|",
        `| **HEX** | \`${hex.toUpperCase()}\` |`,
        `| **RGB** | \`${rgbCss}\` |`,
        `| **HSL** | \`${hslCss}\` |`,
        `| **R** | ${r} |`,
        `| **G** | ${g} |`,
        `| **B** | ${b} |`,
        `| **H** | ${h}° |`,
        `| **S** | ${s}% |`,
        `| **L** | ${l}% |`,
      ].join("\n");

      setResult(markdown);
      Clipboard.copy(hex.toUpperCase());
      showToast({ style: Toast.Style.Success, title: `HEX ${hex.toUpperCase()} copied` });
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Could not parse color", message: String(error) });
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
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Convert Color" onSubmit={(values) => convert((values as { color: string }).color)} />
        </ActionPanel>
      }
    >
      <Form.TextField id="color" title="Color" placeholder="#FF5733, rgb(255,87,51), hsl(9,100%,60%)" defaultValue={clipboardText || ""} />
    </Form>
  );
}
