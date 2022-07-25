import path from 'path';

export const basePathOf = (basedir: string) => (source: string): string => {
  const relative = path.relative(path.dirname(source), basedir);
  return relative.length === 0 ? '' : `${relative}/`;
};
