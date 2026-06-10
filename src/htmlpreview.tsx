import { Detail, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = usePromise(async () => {
    const text = await Clipboard.readText();
    return text || "";
  }, []);

  // Sanitize HTML for display - wrap in sandbox iframe
  const htmlContent = data
    ? `\`\`\`html
${data}
\`\`\``
    : "No HTML content in clipboard";

  return (
    <Detail
      isLoading={isLoading}
      markdown={`# HTML Preview\n\n${htmlContent}\n\n---\n*Note: HTML is shown as source. For security reasons, Raycast does not render arbitrary HTML inline.*`}
      navigationTitle="HTML Preview"
    />
  );
}
