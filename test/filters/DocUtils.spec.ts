import { describe, it, expect } from 'vitest';
import { docUtils } from '../../src/filters/doc-utils';

const renderMarkdown = (markdown: string): string => docUtils(markdown, 'test/fixtures/unexisting/unexisting.md').markdown();

describe('DocUtils', () => {
  it('Should render headings with GitHub compatible ids', () => {
    expect(renderMarkdown('## Button')).toBe('<h2 id="button">Button</h2>\n');
    expect(renderMarkdown('## Component <span>Markdown</span> & `size`')).toBe('<h2 id="component-markdown--size">Component <span>Markdown</span> &amp; <code>size</code></h2>\n');
    expect(renderMarkdown('### Été à l\'**école**')).toBe('<h3 id="été-à-lécole">Été à l&#39;<strong>école</strong></h3>\n');
  });
  it('Should suffix duplicated heading ids', () => {
    expect(renderMarkdown('## Size\n## Size\n## Size')).toBe('<h2 id="size">Size</h2>\n<h2 id="size-1">Size</h2>\n<h2 id="size-2">Size</h2>\n');
  });
  it('Should render tables', () => {
    const result = renderMarkdown('| Name | Type |\n|------|------|\n| size | `string` |');
    expect(result).toContain('<th>Name</th>');
    expect(result).toContain('<td><code>string</code></td>');
  });
  it('Should render fenced code blocks with Prism language class', () => {
    expect(renderMarkdown('```pug\n.button\n```')).toBe('<pre><code class="language-pug">.button\n</code></pre>\n');
  });
  it('Should keep inline html', () => {
    expect(renderMarkdown('Some <strong>inline</strong> html')).toBe('<p>Some <strong>inline</strong> html</p>\n');
  });
});
