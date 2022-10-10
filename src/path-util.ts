import path from 'path';

export const toPosixPath = (currentPath: string): string => currentPath.split(path.win32.sep).join(path.posix.sep);

export const basePathOf = (basedir: string) => (source: string): string => {
  const relative = path.relative(path.dirname(source), basedir);

  if(relative.length === 0) {
    return '';
  }

  return `${toPosixPath(relative)}${path.posix.sep}`;
};
