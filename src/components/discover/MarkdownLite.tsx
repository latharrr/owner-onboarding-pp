// Minimal, safe markdown renderer for AI answers — bold, bullets,
// numbered lists only. Builds React elements directly (no
// dangerouslySetInnerHTML), so streamed LLM text can never inject HTML.

function renderInline(line: string, key: number) {
  const segments = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <span key={key}>
      {segments.map((seg, i) =>
        seg.startsWith('**') && seg.endsWith('**') ? (
          <strong key={i} className="font-semibold text-gray-900">
            {seg.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{seg}</span>
        )
      )}
    </span>
  );
}

export function MarkdownLite({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={key} className={list.ordered ? 'list-decimal pl-5 space-y-1' : 'list-disc pl-5 space-y-1'}>
        {list.items.map((item, i) => (
          <li key={i}>{renderInline(item, i)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  lines.forEach((line, idx) => {
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)/);

    if (bullet) {
      if (!list || list.ordered) {
        flushList(`list-${idx}`);
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
    } else if (numbered) {
      if (!list || !list.ordered) {
        flushList(`list-${idx}`);
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1]);
    } else {
      flushList(`list-${idx}`);
      if (line.trim()) blocks.push(<p key={idx}>{renderInline(line, idx)}</p>);
    }
  });
  flushList('list-end');

  return <div className="space-y-2 text-sm leading-relaxed text-gray-700">{blocks}</div>;
}
