import { componentDoc } from '../../src/filters/component-doc';

describe('ComponentDoc', () => {
  it('Should render documentation component without files', () => {
    const result = componentDoc('## Markdown', {filename: 'test/fixtures/unexisting/unexisting.md', height: '1024'});
    expect(result).toMatch(/.+<h2.+>Markdown<\/h2>.+/);
    expect(result).toContain('Please provide a render file:');
    expect(result).toContain('unexisting.render.pug');
    expect(result).toContain('Please provide a code file:');
    expect(result).toContain('unexisting.code.pug');
  });
  it('Should render documentation component with files', () => {
    const result = componentDoc('## Button', {filename: 'test/fixtures/button/button.md', height: '1024'});
    expect(result).toMatch(/.+<h2.+>Button<\/h2>.+/);
    expect(result).toContain('1024');
    expect(result).toContain('button.render.html');
    expect(result).toContain('&lt;button class=&quot;tikui-button&quot;&gt;Button&lt;/button&gt;');
  });
});
