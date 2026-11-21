import { describe, it, expect } from 'vitest';
import { renderDoc } from '../../src/filters/render-doc';

describe('RenderDoc', () => {
  it('Should render documentation without files', () => {
    const result = renderDoc('## Markdown', {filename: 'test/fixtures/unexisting/unexisting.md', height: '1024'});
    expect(result).toContain('<h2 id="markdown">Markdown</h2>');
    expect(result).toContain('Please provide a render file:');
    expect(result).toContain('unexisting.render.pug');
    expect(result).not.toContain('Please provide a code file:');
  });
  it('Should render documentation with markdown and render only', () => {
    const result = renderDoc('## Button', {filename: 'test/fixtures/button/button.md', height: '1024'});
    expect(result).toContain('<h2 id="button">Button</h2>');
    expect(result).toMatch(/<iframe[^>]+src="[^"]*button\/button.render.html"[^>]+height="1024"/);
    expect(result).not.toContain('tikui-button&quot;&gt;Button');
    expect(result).not.toContain('<pre');
  });
  it('Should use default height', () => {
    const result = renderDoc('## Button', {filename: 'test/fixtures/button/button.md', height: ''});
    expect(result).toContain('height="150"');
  });
});
