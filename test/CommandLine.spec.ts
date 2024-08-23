import { execSync } from 'child_process';
import path, { resolve } from 'path';
import { existsSync } from 'fs';
import * as fs from 'fs';
import { rimrafSync } from 'rimraf';
const copy = require('recursive-copy');

const ERROR_PATH_SEP = `${path.sep}${path.sep}?`

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
  rimrafSync(tikuiPathList.modules);
  rimrafSync(tikuiPathList.dist);
  rimrafSync(tikuiPathList.cache);
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
const faketikuiVerbose = pathListOf('faketikui-verbose');
const faketikuiSelf = pathListOf('faketikui-self');

describe('Command line usage', () => {
  describe('Classic tikui', () => {
    beforeEach(() => removeTikui(faketikui));

    afterEach(() => removeTikui(faketikui))

    it('Should build fake tikui', async () => {
      const expectExistsFile = expectExistingPath(faketikui.dist);
      const stringContent = stringContaining(faketikui.dist);
      await createTikui(faketikui.modules);

      execSync(COMMAND_BUILD, {
        cwd: faketikui.path,
        env: {
          ...process.env,
          TIKUI_PATH: faketikui.path,
        }
      });

      expectExistsFile('index.html');
      expectExistsFile('tikui.css');
      expectExistsFile('sub-dir/index.html');
      const indexContent = stringContent('index.html');
      const subIndexContent = stringContent('sub-dir/index.html');
      expect(indexContent).toContain('Component Markdown');
      expect(indexContent).toContain('src="component/component.render.html"');
      expect(indexContent).toContain('&lt;div class=&quot;component-class&quot;&gt;Component code&lt;/div&gt;');
      expect(indexContent).toMatch(new RegExp(`Please provide a render file:(.+)${ERROR_PATH_SEP}src${ERROR_PATH_SEP}only-md-component${ERROR_PATH_SEP}only-md-component.render.pug`));
      expect(indexContent).toMatch(new RegExp(`Please provide a code file:(.+)${ERROR_PATH_SEP}src${ERROR_PATH_SEP}only-md-component${ERROR_PATH_SEP}only-md-component.code.pug`));
      expect(indexContent).toContain('Template Markdown');
      expect(indexContent).toContain('href="template/template.render.html"');
      expect(indexContent).toContain('&lt;div class=&quot;template-class&quot;&gt;Template code&lt;/div&gt;');
      expect(indexContent).toMatch(new RegExp(`Please provide a render file:(.+)${ERROR_PATH_SEP}src${ERROR_PATH_SEP}only-md-template${ERROR_PATH_SEP}only-md-template.render.pug`));
      expect(indexContent).toMatch(new RegExp(`Please provide a code file:(.+)${ERROR_PATH_SEP}src${ERROR_PATH_SEP}only-md-template${ERROR_PATH_SEP}only-md-template.code.pug`));
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

  describe('Verbosity', () => {
    describe('Not verbose', () => {
      const spiedConsole = jest.spyOn(console, 'log');

      beforeEach(() => {
        spiedConsole.mockClear();
        removeTikui(faketikui);
      });

      afterEach(() => removeTikui(faketikui));

      it('should not show files', async () => {
        await createTikui(faketikui.modules);

        const out = buildTikui(faketikui);

        const stringOut = out.toString();
        expect(stringOut).not.toMatch(/.+ => .+/);
        expect(stringOut).toMatch(/Building on .+ directory/);
      });
    });

    describe('Is verbose', () => {
      const spiedConsole = jest.spyOn(console, 'log');

      beforeEach(() => {
        spiedConsole.mockClear();
        removeTikui(faketikuiVerbose);
      });

      afterEach(() => removeTikui(faketikuiVerbose));

      it('should show files', async () => {
        await createTikui(faketikuiVerbose.modules);

        const out = buildTikui(faketikuiVerbose);

        const stringOut = out.toString();
        expect(stringOut).toContain('index.html');
        expect(stringOut).toContain(`documentation${path.sep}style.css`);
        expect(stringOut).toMatch(/.+ => .+/);
        expect(stringOut).toMatch(/=> .+ using SCSS/);
        expect(stringOut).toMatch(/=> .+ using Pug/);
      });

    });
  });

  describe('No theme', () => {
    beforeEach(() => removeTikui(faketikuiSelf));

    afterEach(() => removeTikui(faketikuiSelf));

    it('should use parts from module itself', async () => {
      await createTikui(faketikuiSelf.modules);
      const expectExistsFile = expectExistingPath(faketikuiSelf.dist);
      const stringContent = stringContaining(faketikuiSelf.dist);

      buildTikui(faketikuiSelf);

      expectExistsFile('index.html');
      expectExistsFile('tikui.css');

      const indexContent = stringContent('index.html');
      expect(indexContent).toMatch(/<div class="self-component--code">[^]*<div class="self-code">[^]*<div class="self-code--html" data-code-text="[^]*&quot;component-class&quot;&gt;Component code&lt;[^]*">[^]*component-class[^]*<\/div>/);
      expect(indexContent).toMatch(/<div class="self-component--code">[^]*<div class="self-code">[^]*<div class="self-code--pug" data-code-text="[^]*\.component-class Component code[^]*">[^]*\.component-class[^]*<\/div>/);
      expect(indexContent).toMatch(/<div class="self-component--markdown">[^]*<h2.*>Component Markdown<\/h2>[^]*<\/div>/);
      expect(indexContent).toMatch(/<div class="self-component--render">[^]*<iframe class="self-component-iframe.*"><\/iframe>/);

      expect(indexContent).toMatch(/<div class="self-template--code">[^]*<div class="self-code">[^]*<div class="self-code--html" data-code-text="[^]*&quot;template-class&quot;&gt;Template code&lt;[^]*">[^]*template-class[^]*<\/div>/);
      expect(indexContent).toMatch(/<div class="self-template--code">[^]*<div class="self-code">[^]*<div class="self-code--pug" data-code-text="[^]*\.template-class Template code[^]*">[^]*\.template-class[^]*<\/div>/);
      expect(indexContent).toMatch(/<div class="self-template--markdown">[^]*<h2.*>Template Markdown<\/h2>[^]*<\/div>/);
      expect(indexContent).toMatch(/<div class="self-template--render">[^]*<a class="self-button".*>Show<\/a>/);
    });
  });
});
