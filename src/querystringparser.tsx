import { Detail, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = usePromise(async () => {
    const text = await Clipboard.readText();
    if (!text) return "No URL in clipboard";

    const trimmed = text.trim();
    let url: URL;

    try {
      url = new URL(trimmed);
    } catch {
      // Try adding https://
      try {
        url = new URL(`https://${trimmed}`);
      } catch {
        return "## URL Parser\n\n⚠️ Could not parse clipboard content as a URL.";
      }
    }

    const params: string[] = [];
    url.searchParams.forEach((value, key) => {
      params.push(`- \`${key}\`: \`${value}\``);
    });

    return [
      "## URL Parser",
      "",
      "### Components",
      `- **Full URL:** \`${url.href}\``,
      `- **Protocol:** \`${url.protocol}\``,
      `- **Host:** \`${url.host}\``,
      `- **Hostname:** \`${url.hostname}\``,
      `- **Port:** \`${url.port || "(default)"}\``,
      `- **Path:** \`${url.pathname}\``,
      `- **Hash:** \`${url.hash || "(none)"}\``,
      "",
      "### Query Parameters",
      params.length > 0 ? params.join("\n") : "*(none)*",
      "",
      "### Origin",
      `\`${url.origin}\``,
    ].join("\n");
  }, []);

  return <Detail isLoading={isLoading} markdown={data || ""} navigationTitle="URL Parser" />;
}
