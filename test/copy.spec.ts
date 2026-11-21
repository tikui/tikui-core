import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Transform } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copy, type CopyOperation } from '../src/copy';

const upperCase = (): Transform => new Transform({
  transform(chunk, _, done) {
    done(null, chunk.toString().toUpperCase());
  },
});

const failing = (): Transform => new Transform({
  transform(_, __, done) {
    done(new Error('Broken transform'));
  },
});

describe('copy', () => {
  let workspace: string;
  let src: string;
  let dest: string;

  const write = (relativePath: string, content: string): void => {
    const target = path.join(src, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  };

  const read = (relativePath: string): string => fs.readFileSync(path.join(dest, relativePath), 'utf-8');

  const exists = (relativePath: string): boolean => fs.existsSync(path.join(dest, relativePath));

  const listDest = (): string[] => (fs.readdirSync(dest, { recursive: true }) as string[])
    .map((entry) => entry.split(path.sep).join('/'))
    .sort();

  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'tikui-copy-'));
    src = path.join(workspace, 'src');
    dest = path.join(workspace, 'out', 'dest');
    fs.mkdirSync(src);
  });

  afterEach(() => {
    fs.rmSync(workspace, { recursive: true, force: true });
  });

  it('should copy a directory recursively without dot and junk files by default', async () => {
    write('index.txt', 'index');
    write('sub/nested/file.txt', 'nested');
    write('.hidden', 'hidden');
    write('.DS_Store', 'junk');
    write('backup~', 'junk');
    write('.dir/inside.txt', 'inside');

    await copy(src, dest);

    expect(listDest()).toEqual(['.dir', '.dir/inside.txt', 'index.txt', 'sub', 'sub/nested', 'sub/nested/file.txt']);
    expect(read('sub/nested/file.txt')).toBe('nested');
  });

  it('should copy dot and junk files when asked', async () => {
    write('.hidden', 'hidden');
    write('Thumbs.db', 'junk');

    await copy(src, dest, { dot: true, junk: true });

    expect(listDest()).toEqual(['.hidden', 'Thumbs.db']);
  });

  it('should filter with globs and negations', async () => {
    write('style.scss', 'scss');
    write('page.pug', 'pug');
    write('image.png', 'png');
    write('.htaccess', 'access');
    write('sub/script.js', 'js');
    write('sub/other.scss', 'scss');
    fs.mkdirSync(path.join(src, 'empty'));

    await copy(src, dest, { dot: true, filter: ['**/*', '!**/*.scss', '!**/*.pug'] });

    expect(listDest()).toEqual(['.htaccess', 'empty', 'image.png', 'sub', 'sub/script.js']);
  });

  it('should only create directories needed by matching files', async () => {
    write('page.pug', 'pug');
    write('sub/page.pug', 'pug');
    write('assets/image.png', 'png');

    await copy(src, dest, { filter: ['**/*.pug'] });

    expect(listDest()).toEqual(['page.pug', 'sub', 'sub/page.pug']);
  });

  it('should rename and transform files', async () => {
    write('page.pug', 'content');
    write('sub/other.pug', 'other');

    await copy(src, dest, {
      rename: (relativePath) => relativePath.replace(/\.pug$/, '.html'),
      transform: upperCase,
    });

    expect(listDest()).toEqual(['page.html', 'sub', 'sub/other.html']);
    expect(read('page.html')).toBe('CONTENT');
    expect(read('sub/other.html')).toBe('OTHER');
  });

  it('should copy a single file', async () => {
    write('file.txt', 'single');

    await copy(path.join(src, 'file.txt'), dest);

    expect(fs.readFileSync(dest, 'utf-8')).toBe('single');
  });

  it('should keep symbolic links unless expanded', async () => {
    write('target.txt', 'target');
    fs.symlinkSync('target.txt', path.join(src, 'link.txt'));

    await copy(src, dest);
    expect(fs.lstatSync(path.join(dest, 'link.txt')).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(path.join(dest, 'link.txt'))).toBe('target.txt');

    fs.rmSync(dest, { recursive: true });
    await copy(src, dest, { expand: true });
    expect(fs.lstatSync(path.join(dest, 'link.txt')).isSymbolicLink()).toBe(false);
    expect(read('link.txt')).toBe('target');
  });

  it('should refuse to overwrite existing files unless asked', async () => {
    write('file.txt', 'new');
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, 'file.txt'), 'old');

    await expect(copy(src, dest)).rejects.toMatchObject({ code: 'EEXIST' });
    expect(read('file.txt')).toBe('old');

    await copy(src, dest, { overwrite: true });
    expect(read('file.txt')).toBe('new');
  });

  it('should emit an event for each copied file', async () => {
    write('first.txt', 'first');
    write('sub/second.txt', 'second');
    const completed: CopyOperation[] = [];

    await copy(src, dest).on(copy.events.COPY_FILE_COMPLETE, (operation) => completed.push(operation));

    expect(completed.sort((a, b) => a.src.localeCompare(b.src))).toEqual([
      { src: path.join(src, 'first.txt'), dest: path.join(dest, 'first.txt') },
      { src: path.join(src, 'sub', 'second.txt'), dest: path.join(dest, 'sub', 'second.txt') },
    ]);
  });

  it('should emit an error event and reject when a file fails to copy', async () => {
    write('page.pug', 'content');
    const onError = vi.fn();
    const onComplete = vi.fn();

    const task = copy(src, dest, { transform: failing })
      .on(copy.events.COPY_FILE_COMPLETE, onComplete)
      .on(copy.events.ERROR, onError);

    await expect(task).rejects.toThrow('Broken transform');
    expect(onComplete).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Broken transform' }),
      { src: path.join(src, 'page.pug'), dest: path.join(dest, 'page.pug') },
    );
  });

  it('should reject when the source does not exist', async () => {
    const onError = vi.fn();

    await expect(copy(path.join(src, 'missing'), dest).on(copy.events.ERROR, onError)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(onError).not.toHaveBeenCalled();
  });
});
