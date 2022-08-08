import { execSync } from 'child_process';
import path, { resolve } from 'path';
import { existsSync } from 'fs';
import * as fs from 'fs';
const rimraf = require("rimraf");
const copy = require('recursive-copy');

const COMMAND_BUILD = 'node ../../dist/tikui-core.js build';

const NODE_MODULES_PATH = resolve(__dirname, '..', 'node_modules');

const expectExistingPath = (dist: string) => (path: string) => expect(existsSync(resolve(dist, path))).toBeTruthy();
const stringContaining = (dist: string) => (path: string) => fs.readFileSync(resolve(dist, path)).toString();

const createTikui = async (modules: string): Promise<void> => { await copy(resolve(NODE_MODULES_PATH, 'tikuidoc-tikui'), resolve(modules, 'tikuidoc-tikui')) };

interface TikuiPathList {
  path: string;
  modules: string;
  dist: string;
  cache: string;
}

const pathListOf = (directory: string): TikuiPathList  => {
  const tikuiPath = resolve(__dirname, directory);
  const {dist} = JSON.parse(fs.readFileSync(path.resolve(tikuiPath, 'tikuiconfig.json')).toString());
  const fallbackDist = dist === undefined ? 'dist' : dist;
  return ({
    path: tikuiPath,
    modules: resolve(tikuiPath, 'node_modules'),
    dist: resolve(tikuiPath, fallbackDist),
    cache: resolve(tikuiPath, 'cache'),
  })
};

const removeTikui = (tikuiPathList: TikuiPathList): void => {
  rimraf.sync(tikuiPathList.modules);
  rimraf.sync(tikuiPathList.dist);
  rimraf.sync(tikuiPathList.cache);
};

const buildTikui = (pathList: TikuiPathList) => {
  try  {
    return execSync(COMMAND_BUILD, {
      cwd: pathList.path,
      env: {
        ...process.env,
        TIKUI_PATH: pathList.path,
      }
    });
  } catch (e) {
    throw [e.stdout.toString(), e.stderr.toString()].join('\n');
  }
}
const faketikui = pathListOf('faketikui');
const faketikuiDifferentPath = pathListOf('faketikui-different-path');

describe('Command line usage', () => {
  describe('Classic tikui', () => {
    beforeEach(() => removeTikui(faketikui));

    afterEach(() => removeTikui(faketikui))

    it('Should build fake tikui', async () => {
      const expectExistsFile = expectExistingPath(faketikui.dist);
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
      expectExistsFile('sub-dir/index.html');
      const indexContent = stringContent('index.html');
      const subIndexContent = stringContent('sub-dir/index.html');
      expect(indexContent).toContain('Component Markdown');
      expect(indexContent).toContain('src="component/component.render.html"');
      expect(indexContent).toContain('&lt;div class=&quot;component-class&quot;&gt;Component code&lt;/div&gt;');
      expect(indexContent).toMatch(/Please provide a render file:(.+)\/src\/only-md-component\/only-md-component.render.pug/);
      expect(indexContent).toMatch(/Please provide a code file:(.+)\/src\/only-md-component\/only-md-component.code.pug/);
      expect(indexContent).toContain('Template Markdown');
      expect(indexContent).toContain('href="template/template.render.html"');
      expect(indexContent).toContain('&lt;div class=&quot;template-class&quot;&gt;Template code&lt;/div&gt;');
      expect(indexContent).toMatch(/Please provide a render file:(.+)\/src\/only-md-template\/only-md-template.render.pug/);
      expect(indexContent).toMatch(/Please provide a code file:(.+)\/src\/only-md-template\/only-md-template.code.pug/);
      expect(indexContent).toContain('href="lib/');
      expect(indexContent).toContain('href="documentation/');
      expect(subIndexContent).toContain('href="../lib/');
      expect(subIndexContent).toContain('href="../documentation/');
      expect(subIndexContent).toContain('src="../component/component.render.html"')
    });

    it('Should expose other resources', async () => {
      const exposedTikui = pathListOf('exposed-tikui');
      const expectExistsFile = expectExistingPath(exposedTikui.dist);
      await createTikui(exposedTikui.modules);

      buildTikui(exposedTikui);

      expectExistsFile('exposed/first.md');
      expectExistsFile('exposed/second.md');
      expectExistsFile('exposed/third.txt');
      expectExistsFile('exposedfile/onefile.txt');

      removeTikui(exposedTikui);
    });
  });

  describe('DifferentPath', () => {

    beforeEach(() => removeTikui(faketikuiDifferentPath));

    afterEach(() => removeTikui(faketikuiDifferentPath));

    it('Should genereate from and to a different place', async () => {
      const expectExistsFile = expectExistingPath(faketikuiDifferentPath.dist);
      await createTikui(faketikuiDifferentPath.modules);

      buildTikui(faketikuiDifferentPath);

      expectExistsFile('index.html');
      expectExistsFile('tikui.css');
      expectExistsFile('component/component.render.html');
    });
  });
});
