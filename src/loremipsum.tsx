import { Action, ActionPanel, Form, Detail, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
  "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
  "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla",
  "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
  "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est",
  "laborum", "praesent", "sapien", "massa", "convallis", "a", "pellentesque", "nec",
  "egestas", "non", "nisi", "cras", "ultricies", "ligula", "sed", "magna", "dictum",
  "porta", "vivamus", "magna", "justo", "lacinia", "eget", "consectetur", "sed",
  "convallis", "at", "tellus", "feugiat", "scelerisque", "varius", "morbi", "enim",
  "nunc", "faucibus", "a", "pellentesque", "sit", "amet", "porttitor", "eget",
];

const SENTENCES = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
];

const PARAGRAPHS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.",
  "Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.",
  "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",
];

export default function Command() {
  const [result, setResult] = useState<string | null>(null);

  function generate(type: string, count: number, startWithLorem: boolean) {
    let text = "";

    switch (type) {
      case "words": {
        const words: string[] = [];
        for (let i = 0; i < count; i++) {
          words.push(WORDS[i % WORDS.length]);
        }
        text = words.join(" ");
        if (startWithLorem) {
          text = "Lorem ipsum " + text.replace(/^lorem ipsum /i, "");
        }
        break;
      }
      case "sentences": {
        const sents: string[] = [];
        for (let i = 0; i < count; i++) {
          sents.push(SENTENCES[i % SENTENCES.length]);
        }
        text = sents.join(" ");
        break;
      }
      case "paragraphs": {
        const paras: string[] = [];
        for (let i = 0; i < count; i++) {
          paras.push(PARAGRAPHS[i % PARAGRAPHS.length]);
        }
        text = paras.join("\n\n");
        break;
      }
    }

    setResult(
      [
        `## Lorem Ipsum (${count} ${type})`,
        "",
        "```",
        text,
        "```",
      ].join("\n")
    );

    Clipboard.copy(text);
    showToast({ style: Toast.Style.Success, title: `Generated ${count} ${type} and copied to clipboard` });
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
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Generate"
            onSubmit={(values) => {
              const vals = values as { type: string; count: string; startWithLorem: boolean };
              generate(vals.type, parseInt(vals.count) || 3, vals.startWithLorem);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="type" title="Generate" defaultValue="paragraphs">
        <Form.Dropdown.Item value="words" title="Words" />
        <Form.Dropdown.Item value="sentences" title="Sentences" />
        <Form.Dropdown.Item value="paragraphs" title="Paragraphs" />
      </Form.Dropdown>
      <Form.TextField id="count" title="Count" defaultValue="3" />
      <Form.Checkbox id="startWithLorem" label="Start with 'Lorem ipsum'" defaultValue={true} />
    </Form>
  );
}
