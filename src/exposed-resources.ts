import path from 'path';
import { config, project } from './tikui-loader';

const exposedResources = config.expose || {};

const resolveProjectPath = (name: string): string => path.resolve(project, name);

export const onExposedResources = (launch: (absoluteFrom: string, relativeTo: string) => void) => Object
  .entries(exposedResources)
  .forEach(([from, to]) => launch(
      resolveProjectPath(from),
      to,
    ));
