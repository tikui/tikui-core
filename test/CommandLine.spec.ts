import { exec, execSync } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';
import * as fs from 'fs';
const rimraf = require("rimraf");
const copy = require('recursive-copy');

const NODE_MODULES_PATH = resolve(__dirname, '..', 'node_modules');
const FAKETIKUI_PATH = resolve(__dirname, 'faketikui');
const FAKETIKUI_MODULES_PATH = resolve(FAKETIKUI_PATH, 'node_modules');
const FAKETIKUI_DIST_PATH = resolve(FAKETIKUI_PATH, 'dist');
const FAKETIKUI_CACHE_PATH = resolve(FAKETIKUI_PATH, 'cache');

const expectExistsFile = (path: string) => expect(existsSync(resolve(FAKETIKUI_DIST_PATH, path))).toBeTruthy();
const stringContent = (path: string) => fs.readFileSync(resolve(FAKETIKUI_DIST_PATH, path)).toString();

describe('Command line usage', () => {
  beforeEach(async () => {
    await copy(resolve(NODE_MODULES_PATH, 'tikuidoc-tikui'), resolve(FAKETIKUI_MODULES_PATH, 'tikuidoc-tikui'));
    await copy(resolve(NODE_MODULES_PATH, 'bootstrap'), resolve(FAKETIKUI_MODULES_PATH, 'bootstrap'));
  });

  it('Should build', () => {
    const result = execSync('node ../../dist/tikui-core.js build', {
      cwd: FAKETIKUI_PATH,
    });
    expect(result.toString()).toContain('index.html');
    expect(result.toString()).toContain('documentation/style.css');
    expectExistsFile('index.html');
    expectExistsFile('tikui.css');
    const indexContent = stringContent('index.html');
    expect(indexContent).toContain('Component Markdown');
    expect(indexContent).toContain('src="/component/component.render.html"');
    expect(indexContent).toContain('&lt;div class=&quot;component-class&quot;&gt;Component code&lt;/div&gt;');
    expect(indexContent).toMatch(/Please provide a render file:(.+)\/src\/only-md-component\/only-md-component.render.pug/);
    expect(indexContent).toMatch(/Please provide a code file:(.+)\/src\/only-md-component\/only-md-component.code.pug/);
    expect(indexContent).toContain('Template Markdown');
    expect(indexContent).toContain('href="/template/template.render.html"');
    expect(indexContent).toContain('&lt;div class=&quot;template-class&quot;&gt;Template code&lt;/div&gt;');
    expect(indexContent).toMatch(/Please provide a render file:(.+)\/src\/only-md-template\/only-md-template.render.pug/);
    expect(indexContent).toMatch(/Please provide a code file:(.+)\/src\/only-md-template\/only-md-template.code.pug/);
  });

  afterEach(() => {
    rimraf.sync(FAKETIKUI_MODULES_PATH);
    rimraf.sync(FAKETIKUI_DIST_PATH);
    rimraf.sync(FAKETIKUI_CACHE_PATH);
  });
});
