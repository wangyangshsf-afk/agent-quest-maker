type Block =
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "text"; lines: string[] };

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

const isDivider = (line: string) => /^\|?[\s:|-]+\|[\s:|-]*$/.test(line.trim());

function parse(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) blocks.push({ type: "text", lines: buf });
    buf = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const next = lines[i + 1];
    if (line.trim().startsWith("|") && next && isDivider(next)) {
      flush();
      const head = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i]!.trim().startsWith("|")) {
        rows.push(cells(lines[i]!));
        i++;
      }
      i--;
      blocks.push({ type: "table", head, rows });
    } else if (line.trim() === "") {
      flush();
    } else {
      buf.push(line);
    }
  }
  flush();
  return blocks;
}

const clean = (s: string) => s.replace(/\*\*/g, "").replace(/^[-*]\s+/, "· ");

export function ChatMessage({ content }: { content: string }) {
  const blocks = parse(content);
  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.type === "table" ? (
          <div key={i} className="overflow-hidden rounded-xl border-2 border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-muted">
                  {b.head.map((h, j) => (
                    <th key={j} className="px-3 py-2 font-black text-foreground">
                      {clean(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j} className="border-t border-border">
                    {r.map((c, k) => (
                      <td key={k} className="px-3 py-2 align-top text-foreground">
                        {clean(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {b.lines.map(clean).join("\n")}
          </p>
        ),
      )}
    </div>
  );
}
