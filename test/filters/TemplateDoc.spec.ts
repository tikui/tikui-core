import { templateDoc } from '../../src/filters/template-doc';

describe('TemplateDoc', () => {
  it('Should render documentation template without files', () => {
    const result = templateDoc('## Markdown', {filename: 'test/fixtures/unexisting/unexisting.md'});
    expect(result).toMatch(/.+<h2.+>Markdown<\/h2>.+/);
    expect(result).toContain('Please provide a render file:');
    expect(result).toContain('unexisting.render.pug');
    expect(result).toContain('Please provide a code file:');
    expect(result).toContain('unexisting.code.pug');
  });
  it('Should render documentation template with files', () => {
    const result = templateDoc('## Button', {filename: 'test/fixtures/button/button.md'});
    expect(result).toMatch(/.+<h2.+>Button<\/h2>.+/);
    expect(result).toContain('Show');
    expect(result).toContain('button.render.html');
    expect(result).toContain('&lt;button class=&quot;tikui-button&quot;&gt;Button&lt;/button&gt;');
  });
});
