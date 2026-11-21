import { EventEmitter } from 'node:events';
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
}

const events = {
  ERROR: 'error',
  COPY_FILE_COMPLETE: 'copyFileComplete',
} as const;

export interface CopyTask extends Promise<CopyOperation[]> {
  on(event: typeof events.COPY_FILE_COMPLETE, listener: (operation: CopyOperation) => void): this;
  on(event: typeof events.ERROR, listener: (error: unknown, operation: CopyOperation) => void): this;
}

interface Entry {
  path: string;
  stats: Stats;
}

interface PlannedOperation extends CopyOperation {
  stats: Stats;
}

class CopyFailure {
  constructor(readonly error: unknown, readonly operation: CopyOperation) {}
}

const CONCURRENCY = 255;

const JUNK = /^npm-debug\.log$|^\..*\.swp$|^\.DS_Store$|^\.AppleDouble$|^\.LSOverride$|^Icon\r$|^\._.*|^\.Spotlight-V100$|\.Trashes|^__MACOSX$|~$|^Thumbs\.db$|^ehthumbs\.db$|^Desktop\.ini$/;

type StatPath = (target: string) => Promise<Stats>;

const listEntries = async (directory: string, statPath: StatPath): Promise<Entry[]> => {
  const names = await readdir(directory);
  const nested = await Promise.all(names.map(async (name): Promise<Entry[]> => {
    const entryPath = path.join(directory, name);
    const stats = await statPath(entryPath);
    const entry = { path: entryPath, stats };
    return stats.isDirectory() ? [entry, ...await listEntries(entryPath, statPath)] : [entry];
  }));
  return nested.flat();
};

const toGlobMatcher = (filter: string[] | undefined, dot: boolean): ((relativePath: string) => boolean) => {
  if (filter === undefined) {
    return () => true;
  }
  const patterns = filter.map((pattern) => pattern.startsWith('!')
    ? { include: false, matches: picomatch(pattern.slice(1), { dot }) }
    : { include: true, matches: picomatch(pattern, { dot }) });
  return (relativePath) => patterns.reduce(
    (included, { include, matches }) => include ? included || matches(relativePath) : included && !matches(relativePath),
    false,
  );
};

const toPosix = (relativePath: string): string => relativePath.split(path.sep).join(path.posix.sep);

const isKept = (options: CopyOptions): ((relativePath: string) => boolean) => {
  const dot = Boolean(options.dot);
  const junk = Boolean(options.junk);
  const matchesGlob = toGlobMatcher(options.filter, dot);
  return (relativePath) => {
    const filename = path.basename(relativePath);
    return (dot || !filename.startsWith('.'))
      && (junk || !JUNK.test(filename))
      && matchesGlob(toPosix(relativePath));
  };
};

const planOperations = async (src: string, dest: string, options: CopyOptions): Promise<PlannedOperation[]> => {
  const statPath: StatPath = options.expand ? stat : lstat;
  const rootStats = await statPath(src);
  const entries = [
    { path: src, stats: rootStats },
    ...rootStats.isDirectory() ? await listEntries(src, statPath) : [],
  ];
  const kept = isKept(options);
  return entries
    .map((entry) => ({ relativePath: path.relative(src, entry.path), stats: entry.stats }))
    .filter(({ relativePath }) => kept(relativePath))
    .map(({ relativePath, stats }) => ({
      src: path.join(src, relativePath),
      dest: path.join(dest, options.rename ? options.rename(relativePath) : relativePath),
      stats,
    }));
};

const isMissing = (error: unknown): boolean => (error as NodeJS.ErrnoException).code === 'ENOENT';

const ensureWritable = async (dest: string, srcStats: Stats, overwrite: boolean): Promise<void> => {
  const destStats = await lstat(dest).catch((error: unknown) => {
    if (isMissing(error)) {
      return undefined;
    }
    throw error;
  });
  if (destStats === undefined || (srcStats.isDirectory() && destStats.isDirectory())) {
    return;
  }
  if (!overwrite) {
    throw Object.assign(new Error(`EEXIST, file already exists ${dest}`), { code: 'EEXIST', path: dest });
  }
  await rm(dest, { recursive: true, force: true });
};

const copyFile = async ({ src, dest, stats }: PlannedOperation, options: CopyOptions): Promise<void> => {
  const read = createReadStream(src);
  const write = createWriteStream(dest, { mode: stats.mode });
  const transformStream = options.transform?.(src, dest, stats);
  await (transformStream ? pipeline(read, transformStream, write) : pipeline(read, write));
  await utimes(dest, stats.atime, stats.mtime).catch(() => undefined);
};

const copySymlink = async ({ src, dest }: PlannedOperation): Promise<void> => {
  await symlink(await readlink(src), dest);
};

const copyEntry = async (operation: PlannedOperation, options: CopyOptions): Promise<void> => {
  const { src, dest, stats } = operation;
  try {
    await ensureWritable(dest, stats, Boolean(options.overwrite));
    if (stats.isDirectory()) {
      await mkdir(dest, { recursive: true });
      return;
    }
    await mkdir(path.dirname(dest), { recursive: true });
    if (stats.isSymbolicLink()) {
      await copySymlink(operation);
    } else {
      await copyFile(operation, options);
    }
  } catch (error: unknown) {
    throw new CopyFailure(error, { src, dest });
  }
};

const runAll = async <T>(items: T[], task: (item: T) => Promise<void>): Promise<void> => {
  let next = 0;
  let failed = false;
  const worker = async (): Promise<void> => {
    while (!failed && next < items.length) {
      const item = items[next];
      next += 1;
      try {
        await task(item);
      } catch (error: unknown) {
        failed = true;
        throw error;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
};

const isFile = (stats: Stats): boolean => !stats.isDirectory() && !stats.isSymbolicLink();

const copyFiles = (src: string, dest: string, options: CopyOptions = {}): CopyTask => {
  const emitter = new EventEmitter();
  let finished = false;

  const run = async (): Promise<CopyOperation[]> => {
    await mkdir(path.dirname(dest), { recursive: true });
    const operations = await planOperations(src, dest, options);
    const copied: CopyOperation[] = [];
    try {
      await runAll(operations, async (operation) => {
        await copyEntry(operation, options);
        const copyOperation = { src: operation.src, dest: operation.dest };
        copied.push(copyOperation);
        if (!finished && isFile(operation.stats)) {
          emitter.emit(events.COPY_FILE_COMPLETE, copyOperation);
        }
      });
    } catch (failure: unknown) {
      if (!(failure instanceof CopyFailure)) {
        throw failure;
      }
      finished = true;
      if (emitter.listenerCount(events.ERROR) > 0) {
        emitter.emit(events.ERROR, failure.error, failure.operation);
      }
      throw failure.error;
    }
    return copied;
  };

  const promise = run().finally(() => {
    finished = true;
  });
  const task: CopyTask = Object.assign(promise, {
    on: (event: string, listener: Parameters<EventEmitter['on']>[1]): CopyTask => {
      emitter.on(event, listener);
      return task;
    },
  });
  return task;
};

export const copy = Object.assign(copyFiles, { events });
