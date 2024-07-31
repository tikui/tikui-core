import path from 'path';
import {config, project} from './tikui-loader';

export const pluginPath = () => {
  if(config.documentation === undefined) {
    return project;
  }
  return path.dirname(require.resolve(path.join(`tikuidoc-${config.documentation}`, 'package.json')));
};
