import { code, component, componentRender, template, templateRender } from '../../src/filters/documentation-templates';

describe('Documentation Templates', () => {
  it('Should compile component', () => {
    const result = component({code: 'Code', markdown: 'Markdown', render: 'Render'});
    expect(result).toContain('Code');
    expect(result).toContain('Render');
    expect(result).toContain('Markdown');
  });
  it('Should compile template', () => {
    const result = template({code: 'Code', markdown: 'Markdown', render: 'Render'});
    expect(result).toContain('Code');
    expect(result).toContain('Render');
    expect(result).toContain('Markdown');
  });
  it('Should render component', () => {
    const result = componentRender({src: '/path/to/component', height: '280'});
    expect(result).toContain('/path/to/component');
    expect(result).toContain('280');
  });
  it('Should render template', () => {
    const result = templateRender({src: '/path/to/template'});
    expect(result).toContain('/path/to/template');
  });
  it('Should compile code', () => {
    const result = code({htmlCode: 'HTML example', pugCode: 'pug example'});
    expect(result).toContain('HTML example');
    expect(result).toContain('pug example');
  });
});
