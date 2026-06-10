import { Detail, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = usePromise(async () => {
    const text = await Clipboard.readText();
    if (!text) return "No token in clipboard";

    const trimmed = text.trim();

    try {
      const parts = trimmed.split(".");

      if (parts.length !== 3) {
        return "## JWT Debugger\n\n⚠️ Not a valid JWT token. A JWT must have exactly 3 parts separated by dots.";
      }

      const [headerB64, payloadB64, signature] = parts;

      // Decode header and payload
      const headerJson = Buffer.from(headerB64, "base64url").toString("utf-8");
      const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf-8");

      const header = JSON.parse(headerJson);
      const payload = JSON.parse(payloadJson);

      let output = "## JWT Debugger\n\n";

      // Header
      output += "### Header\n```json\n";
      output += JSON.stringify(header, null, 2);
      output += "\n```\n\n";

      // Payload
      output += "### Payload\n```json\n";
      output += JSON.stringify(payload, null, 2);
      output += "\n```\n\n";

      // Claims info
      output += "### Claims\n\n";
      if (payload.iss) output += `- **Issuer (iss):** ${payload.iss}\n`;
      if (payload.sub) output += `- **Subject (sub):** ${payload.sub}\n`;
      if (payload.aud) output += `- **Audience (aud):** ${payload.aud}\n`;
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const isExpired = expDate < new Date();
        output += `- **Expires (exp):** ${expDate.toISOString()} ${isExpired ? "⚠️ **EXPIRED**" : "✅ Valid"}\n`;
      }
      if (payload.nbf) {
        const nbfDate = new Date(payload.nbf * 1000);
        output += `- **Not Before (nbf):** ${nbfDate.toISOString()}\n`;
      }
      if (payload.iat) {
        const iatDate = new Date(payload.iat * 1000);
        output += `- **Issued At (iat):** ${iatDate.toISOString()}\n`;
      }
      if (payload.jti) output += `- **JWT ID (jti):** ${payload.jti}\n`;

      // Signature
      output += "\n### Signature\n\n";
      output += `\`${signature.substring(0, 50)}...\`\n\n`;
      output += `*(Cannot verify signature without secret/key)*\n`;

      return output;
    } catch (error) {
      return `## JWT Debugger\n\n⚠️ Error decoding JWT: ${error instanceof Error ? error.message : String(error)}`;
    }
  }, []);

  return <Detail isLoading={isLoading} markdown={data || ""} navigationTitle="JWT Debugger" />;
}
