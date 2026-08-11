import { readClipboard, copyToClipboard } from "./utils/clipboard";

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  // Detect and convert case
  const trimmed = text.trim();

  // Generate all case variants
  function toCamelCase(s: string): string {
    return s.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^(.)/, (_, c) => c.toLowerCase());
  }

  function toPascalCase(s: string): string {
    return s.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  function toSnakeCase(s: string): string {
    return s
      .replace(/([A-Z])/g, "_$1")
      .replace(/[-\s]+/g, "_")
      .replace(/^_/, "")
      .replace(/__+/g, "_")
      .toLowerCase();
  }

  function toKebabCase(s: string): string {
    return s
      .replace(/([A-Z])/g, "-$1")
      .replace(/[_\s]+/g, "-")
      .replace(/^-/, "")
      .replace(/--+/g, "-")
      .toLowerCase();
  }

  function toConstantCase(s: string): string {
    return toSnakeCase(s).toUpperCase();
  }

  function toTitleCase(s: string): string {
    return s
      .replace(/[-_\s]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  function toSentenceCase(s: string): string {
    return s
      .replace(/[-_\s]+/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  }

  const variants = [
    ["camelCase", toCamelCase(trimmed)],
    ["PascalCase", toPascalCase(trimmed)],
    ["snake_case", toSnakeCase(trimmed)],
    ["kebab-case", toKebabCase(trimmed)],
    ["CONSTANT_CASE", toConstantCase(trimmed)],
    ["Title Case", toTitleCase(trimmed)],
    ["Sentence case", toSentenceCase(trimmed)],
  ];

  // Build a summary and copy camelCase as default
  const summary = variants.map(([name, value]) => `${name}: ${value}`).join("\n");

  await copyToClipboard(summary, `All case variants copied`);
}
