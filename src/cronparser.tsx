import { Detail, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = usePromise(async () => {
    const text = await Clipboard.readText();
    if (!text) return "No cron expression in clipboard";

    const trimmed = text.trim();

    try {
      // Parse cron expression (5 or 6 fields)
      const fields = trimmed.split(/\s+/);

      if (fields.length < 5 || fields.length > 7) {
        return `## Cron Parser\n\n⚠️ Expected 5-7 fields but got ${fields.length}. A standard cron expression has 5 fields.`;
      }

      const labels = [
        "Minute",
        "Hour",
        "Day of Month",
        "Month",
        "Day of Week",
        "Year (optional)",
        "Seconds (optional)",
      ];
      const ranges = [
        [0, 59],
        [0, 23],
        [1, 31],
        [1, 12],
        [0, 7],
        [1970, 2099],
        [0, 59],
      ];

      const monthNames = [
        "",
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      function describeField(value: string, label: string, range: number[]): string {
        const parts: string[] = [];

        if (value === "*") {
          parts.push(`Every ${label.toLowerCase()}`);
        } else if (value.includes("/")) {
          const [base, step] = value.split("/");
          const stepNum = parseInt(step);
          if (base === "*") {
            parts.push(`Every ${stepNum}${getOrdinal(stepNum)} ${label.toLowerCase()}`);
          } else {
            const [start, end] = base.split("-");
            parts.push(
              `Every ${stepNum}${getOrdinal(stepNum)} ${label.toLowerCase()} from ${start} to ${end || range[1]}`,
            );
          }
        } else if (value.includes("-")) {
          const [start, end] = value.split("-");
          parts.push(`From ${start} to ${end}`);
          if (label === "Month") {
            parts.push(`(${monthNames[parseInt(start)]} to ${monthNames[parseInt(end)]})`);
          }
        } else if (value.includes(",")) {
          const items = value.split(",");
          if (label === "Month") {
            parts.push(items.map((m) => monthNames[parseInt(m)] || m).join(", "));
          } else if (label === "Day of Week") {
            parts.push(items.map((d) => dayNames[parseInt(d)] || d).join(", "));
          } else {
            parts.push(`At ${items.join(", ")}`);
          }
        } else {
          if (label === "Month") {
            parts.push(`In ${monthNames[parseInt(value)] || value}`);
          } else if (label === "Day of Week") {
            parts.push(`On ${dayNames[parseInt(value)] || value}`);
          } else {
            parts.push(`At ${value}`);
          }
        }

        return parts.join(" ");
      }

      function getOrdinal(n: number): string {
        if (n % 100 >= 11 && n % 100 <= 13) return "th";
        switch (n % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      }

      let output = "## Cron Parser\n\n";
      output += `**Expression:** \`${trimmed}\`\n\n`;
      output += "### Field Breakdown\n\n";
      output += "| Field | Value | Meaning |\n";
      output += "|-------|-------|--------|\n";

      for (let i = 0; i < fields.length; i++) {
        const label = labels[i];
        const value = fields[i];
        const meaning = describeField(value, label, ranges[i]);
        output += `| ${label} | \`${value}\` | ${meaning} |\n`;
      }

      output += "\n### Schedule\n\n";

      // Build human-readable schedule
      const minute = fields[0];
      const hour = fields[1];
      const dom = fields[2];
      const month = fields[3];
      const dow = fields[4];

      let schedule = "";

      if (minute === "*" && hour === "*" && dom === "*" && month === "*" && dow === "*") {
        schedule = "**Every minute**";
      } else if (dom !== "*" && month !== "*") {
        schedule = `At ${hour}:${minute.padStart(2, "0")} on day ${dom} of ${monthNames[parseInt(month)] || month}`;
      } else if (dow !== "*") {
        const days = dow
          .split(",")
          .map((d) => dayNames[parseInt(d)] || d)
          .join(", ");
        schedule = `At ${hour}:${minute.padStart(2, "0")} on ${days}`;
      } else if (dom !== "*") {
        schedule = `At ${hour}:${minute.padStart(2, "0")} on day ${dom} of each month`;
      } else {
        schedule = `At ${hour}:${minute.padStart(2, "0")} every day`;
      }

      output += `${schedule}\n`;

      return output;
    } catch (error) {
      return `## Cron Parser\n\n⚠️ Error parsing: ${error instanceof Error ? error.message : String(error)}`;
    }
  }, []);

  return <Detail isLoading={isLoading} markdown={data || ""} navigationTitle="Cron Parser" />;
}
