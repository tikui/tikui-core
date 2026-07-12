import pug, { LocalsObject, Options } from 'pug';
import { basePathOf } from './path-util';

export const renderPugFile = (options: Options & LocalsObject & { basedir: string }) => (source: string): string => {
  const basePath = basePathOf(options.basedir)(source);
  return pug.renderFile(source, options).replaceAll('[[TIKUI_BASEPATH]]', basePath);
};
