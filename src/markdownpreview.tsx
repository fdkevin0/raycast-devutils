import { Detail, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = usePromise(async () => {
    const text = await Clipboard.readText();
    return text || "";
  }, []);

  return (
    <Detail
      isLoading={isLoading}
      markdown={data || "No markdown content in clipboard"}
      navigationTitle="Markdown Preview"
    />
  );
}
