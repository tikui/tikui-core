import { execSync } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';
import * as fs from 'fs';
const rimraf = require("rimraf");
const copy = require('recursive-copy');

const COMMAND_BUILD = 'node ../../dist/tikui-core.js build';

const NODE_MODULES_PATH = resolve(__dirname, '..', 'node_modules');

const expectExistingFile = (dist: string) => (path: string) => expect(existsSync(resolve(dist, path))).toBeTruthy();
const stringContaining = (dist: string) => (path: string) => fs.readFileSync(resolve(dist, path)).toString();

const createTikui = async (modules: string): Promise<void> => {
  await copy(resolve(NODE_MODULES_PATH, 'tikuidoc-tikui'), resolve(modules, 'tikuidoc-tikui'));
  await copy(resolve(NODE_MODULES_PATH, 'bootstrap'), resolve(modules, 'bootstrap'));
}

interface TikuiPathList {
  path: string;
  modules: string;
  dist: string;
  cache: string;
}

const pathListOf = (directory: string): TikuiPathList  => {
  const path = resolve(__dirname, directory);
  return ({
    path,
    modules: resolve(path, 'node_modules'),
    dist: resolve(path, 'dist'),
    cache: resolve(path, 'cache'),
  })
};

const removeTikui = (tikuiPathList: TikuiPathList): void => {
  rimraf.sync(tikuiPathList.modules);
  rimraf.sync(tikuiPathList.dist);
  rimraf.sync(tikuiPathList.cache);
};

describe('Command line usage', () => {
  it('Should build fake tikui', async () => {
    const faketikui = pathListOf('faketikui');
    const expectExistsFile = expectExistingFile(faketikui.dist);
    const stringContent = stringContaining(faketikui.dist);
    await createTikui(faketikui.modules);

    const result = execSync(COMMAND_BUILD, {
      cwd: faketikui.path,
      env: {
        ...process.env,
        TIKUI_PATH: faketikui.path,
      }
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

    removeTikui(faketikui);
  });

  it('Should expose other resources', async () => {
    const exposedTikui = pathListOf('exposed-tikui');
    const expectExistsFile = expectExistingFile(exposedTikui.dist);
    await createTikui(exposedTikui.modules);

    execSync(COMMAND_BUILD, {
      cwd: exposedTikui.path,
      env: {
        ...process.env,
        TIKUI_PATH: exposedTikui.path,
      }
    });

    expectExistsFile('exposed/first.md');
    expectExistsFile('exposed/second.md');
    expectExistsFile('exposed/third.txt');
    expectExistsFile('exposedfile/onefile.txt');

    removeTikui(exposedTikui);
  });
});
