import { readClipboard, copyToClipboard } from "./utils/clipboard";
import { showToast, Toast } from "@raycast/api";

/**
 * Basic PHP unserialize parser.
 * Handles: N, b, i, d, s, a types.
 */
function phpUnserialize(input: string): unknown {
  let pos = 0;
  const s = input.trim();

  function read(): unknown {
    if (pos >= s.length) throw new Error("Unexpected end of input");

    const type = s[pos];
    pos++;

    switch (type) {
      case "N": {
        if (s[pos] !== ";") throw new Error("Expected ; after N");
        pos++;
        return null;
      }
      case "b": {
        if (s[pos] !== ":") throw new Error("Expected : after b");
        pos++;
        const val = s[pos] === "1";
        pos += 2; // skip 0; or 1;
        return val;
      }
      case "i": {
        if (s[pos] !== ":") throw new Error("Expected : after i");
        pos++;
        let numStr = "";
        while (s[pos] !== ";") numStr += s[pos++];
        pos++; // skip ;
        return parseInt(numStr, 10);
      }
      case "d": {
        if (s[pos] !== ":") throw new Error("Expected : after d");
        pos++;
        let numStr = "";
        while (s[pos] !== ";") numStr += s[pos++];
        pos++;
        return parseFloat(numStr);
      }
      case "s": {
        if (s[pos] !== ":") throw new Error("Expected : after s");
        pos++;
        let lenStr = "";
        while (s[pos] !== ":") lenStr += s[pos++];
        const len = parseInt(lenStr, 10);
        pos++; // skip :
        if (s[pos] !== '"') throw new Error('Expected " after s:len:');
        pos++;
        let str = "";
        while (str.length < len) {
          str += s[pos++];
        }
        pos += 2; // skip ";
        return str;
      }
      case "a": {
        if (s[pos] !== ":") throw new Error("Expected : after a");
        pos++;
        let countStr = "";
        while (s[pos] !== ":") countStr += s[pos++];
        const count = parseInt(countStr, 10);
        pos++; // skip :
        if (s[pos] !== "{") throw new Error("Expected { after a:count:");
        pos++;
        const result: Record<string, unknown> = {};
        for (let i = 0; i < count; i++) {
          const key = read();
          const value = read();
          result[String(key)] = value;
        }
        if (s[pos] !== "}") throw new Error("Expected }");
        pos++;
        return result;
      }
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  return read();
}

export default async function Command() {
  const text = await readClipboard();
  if (!text) return;

  try {
    const data = phpUnserialize(text.trim());
    const json = JSON.stringify(data, null, 2);
    await copyToClipboard(json, "PHP unserialized → JSON");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not unserialize",
      message: error instanceof Error ? error.message : "Invalid PHP serialized data",
    });
  }
}
