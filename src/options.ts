import path from 'node:path';

import { componentDoc } from './filters/component-doc';
import { templateDoc } from './filters/template-doc';
import { reload } from './filters/reload';
import { pluginPath } from './documentation-loader';
import { projectSrc } from './tikui-loader';
import MultipleBasedirsPlugin from 'pug-multiple-basedirs-plugin';

const options = {
    basedir: projectSrc,
    plugins: [
      MultipleBasedirsPlugin({
        paths: [
          path.resolve(
            pluginPath(),
            'src',
          ),
          projectSrc,
        ],
      }),
    ],
    filters: {
        componentDoc,
        templateDoc,
        reload: reload(false)
    }
};

export default options;
