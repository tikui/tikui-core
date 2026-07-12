import path from 'node:path';
import { createRequire } from 'node:module';
import {config, project} from './tikui-loader';

const require = createRequire(import.meta.url);

export const pluginPath = () => {
  if(config.documentation === undefined) {
    return project;
  }
  return path.dirname(require.resolve(path.join(`tikuidoc-${config.documentation}`, 'package.json')));
};
