import { marked, Renderer, Tokens } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

const renderer = new Renderer();

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}\-_]/gu, '');

const headingSlugCounts = new Map<string, number>();

renderer.heading = function ({ tokens, depth }: Tokens.Heading): string {
  const text = this.parser.parseInline(tokens);
  const raw = tokens.map(t => ('raw' in t ? t.raw : '') || ('text' in t ? t.text : '') || '').join('');
  const baseSlug = slugify(raw) || `heading-${depth}`;
  const count = headingSlugCounts.get(baseSlug) ?? 0;
  const slug = count > 0 ? `${baseSlug}-${count}` : baseSlug;
  headingSlugCounts.set(baseSlug, count + 1);
  return `<h${depth} id="${slug}">${text}</h${depth}>\n`;
};

renderer.code = function ({ text, lang }: Tokens.Code): string {
  if (lang === 'mermaid') {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div class="mermaid">${escaped}</div>`;
  }

  if (lang) {
    try {
      if (hljs.getLanguage(lang)) {
        const highlighted = hljs.highlight(text, { language: lang, ignoreIllegals: true }).value;
        return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      }
    } catch {
      // fall through to auto-detect
    }
  }
  try {
    const highlighted = hljs.highlightAuto(text).value;
    return `<pre><code class="hljs">${highlighted}</code></pre>`;
  } catch {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre><code class="hljs">${escaped}</code></pre>`;
  }
};

marked.use({
  renderer,
  gfm: true,
  breaks: false,
  async: false,
});

export function renderMarkdown(content: string): string {
  try {
    headingSlugCounts.clear();
    const html = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['foreignObject'],
      ADD_ATTR: ['id', 'class', 'target', 'rel'],
    });
  } catch {
    return `<pre>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
  }
}

export interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

export function extractOutline(html: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  const re = /<h([1-6])\s+id="([^"]+)">([\s\S]*?)<\/h\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[3].replace(/<[^>]+>/g, '').trim();
    if (text) items.push({ level: Number(m[1]), id: m[2], text });
  }
  return items;
}
