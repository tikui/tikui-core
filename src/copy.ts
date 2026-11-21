import { createReadStream, createWriteStream, type Stats } from 'node:fs';
import { lstat, mkdir, readdir, readlink, rm, stat, symlink, utimes } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import picomatch from 'picomatch';

export interface CopyOperation {
  src: string;
  dest: string;
}

export interface CopyOptions {
  overwrite?: boolean;
  expand?: boolean;
  dot?: boolean;
  junk?: boolean;
  filter?: string[];
  rename?: (relativePath: string) => string;
  transform?: (src: string, dest: string, stats: Stats) => NodeJS.ReadWriteStream | undefined;
  onFileCopied?: (operation: CopyOperation) => void;
}

export class CopyError extends Error {
  constructor(readonly operation: CopyOperation, cause: unknown) {
    super(`Failing to copy file from ${operation.src} to ${operation.dest}`, { cause });
    this.name = 'CopyError';
  }
}

interface Entry {
  relativePath: string;
  stats: Stats;
}

interface PlannedCopy extends CopyOperation {
  stats: Stats;
}

const JUNK_NAMES = new Set(['npm-debug.log', '.DS_Store', '.AppleDouble', '.LSOverride', 'Icon\r', '.Spotlight-V100', '.Trashes', '__MACOSX', 'Thumbs.db', 'ehthumbs.db', 'Desktop.ini']);

const isJunk = (name: string): boolean => JUNK_NAMES.has(name) || name.startsWith('._') || name.endsWith('~') || /^\..*\.swp$/.test(name);

const CONCURRENCY = 64;

const listEntries = async (root: string, statPath: (target: string) => Promise<Stats>, relativePath = ''): Promise<Entry[]> => {
  const stats = await statPath(path.join(root, relativePath));
  if (!stats.isDirectory()) {
    return [{ relativePath, stats }];
  }
  const names = await readdir(path.join(root, relativePath));
  const children = await Promise.all(names.map((name) => listEntries(root, statPath, path.join(relativePath, name))));
  return [{ relativePath, stats }, ...children.flat()];
};

const globMatcher = (filter: string[], dot: boolean) => {
  const rules = filter.map((pattern) => {
    const negated = pattern.startsWith('!');
    return { negated, matches: picomatch(negated ? pattern.slice(1) : pattern, { dot }) };
  });
  return (posixPath: string): boolean => rules.reduce((kept, { negated, matches }) => matches(posixPath) ? !negated : kept, false);
};

const keeps = ({ dot = false, junk = false, filter }: CopyOptions) => {
  const matchesFilter = filter ? globMatcher(filter, dot) : () => true;
  return ({ relativePath }: Entry): boolean => {
    const name = path.basename(relativePath);
    return (dot || !name.startsWith('.'))
      && (junk || !isJunk(name))
      && matchesFilter(relativePath.split(path.sep).join(path.posix.sep));
  };
};

const prepareDestination = async ({ dest, stats }: PlannedCopy, overwrite: boolean): Promise<void> => {
  const existing = await lstat(dest).catch(() => undefined);
  if (existing === undefined || (existing.isDirectory() && stats.isDirectory())) {
    return;
  }
  if (!overwrite) {
    throw Object.assign(new Error(`EEXIST, file already exists ${dest}`), { code: 'EEXIST', path: dest });
  }
  await rm(dest, { recursive: true, force: true });
};

const copyFile = async ({ src, dest, stats }: PlannedCopy, transform: CopyOptions['transform']): Promise<void> => {
  const read = createReadStream(src);
  const write = createWriteStream(dest, { mode: stats.mode });
  const transformStream = transform?.(src, dest, stats);
  await (transformStream ? pipeline(read, transformStream, write) : pipeline(read, write));
  await utimes(dest, stats.atime, stats.mtime).catch(() => undefined);
};

const copyEntry = async (planned: PlannedCopy, options: CopyOptions): Promise<void> => {
  await prepareDestination(planned, options.overwrite ?? false);
  if (planned.stats.isDirectory()) {
    await mkdir(planned.dest, { recursive: true });
    return;
  }
  await mkdir(path.dirname(planned.dest), { recursive: true });
  if (planned.stats.isSymbolicLink()) {
    await symlink(await readlink(planned.src), planned.dest);
    return;
  }
  await copyFile(planned, options.transform);
  options.onFileCopied?.({ src: planned.src, dest: planned.dest });
};

const inParallel = async <T>(items: T[], task: (item: T) => Promise<void>): Promise<void> => {
  const queue = items.values();
  const worker = async (): Promise<void> => {
    for (const item of queue) {
      await task(item);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
};

export const copy = async (src: string, dest: string, options: CopyOptions = {}): Promise<void> => {
  const entries = await listEntries(src, options.expand ? stat : lstat);
  const planned = entries.filter(keeps(options)).map(({ relativePath, stats }) => ({
    src: path.join(src, relativePath),
    dest: path.join(dest, options.rename?.(relativePath) ?? relativePath),
    stats,
  }));
  await inParallel(planned, (entry) => copyEntry(entry, options).catch((error: unknown) => {
    throw new CopyError({ src: entry.src, dest: entry.dest }, error);
  }));
};
