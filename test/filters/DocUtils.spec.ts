import { describe, it, expect } from 'vitest';
import { docUtils } from '../../src/filters/doc-utils';

const renderMarkdown = (markdown: string): string => docUtils(markdown, 'test/fixtures/unexisting/unexisting.md').markdown();

describe('DocUtils', () => {
  it('Should render headings without generated ids', () => {
    expect(renderMarkdown('## Button')).toBe('<h2>Button</h2>\n');
  });
  it('Should render tables', () => {
    const result = renderMarkdown('| Name | Type |\n|------|------|\n| size | `string` |');
    expect(result).toContain('<th>Name</th>');
    expect(result).toContain('<td><code>string</code></td>');
  });
  it('Should render fenced code blocks with language class', () => {
    expect(renderMarkdown('```pug\n.button\n```')).toBe('<pre><code class="language-pug">.button\n</code></pre>\n');
  });
  it('Should keep inline html', () => {
    expect(renderMarkdown('Some <strong>inline</strong> html')).toBe('<p>Some <strong>inline</strong> html</p>\n');
  });
});
