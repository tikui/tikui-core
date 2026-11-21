import { onLibResources } from './lib-resources';
import path from 'node:path';
import fs from 'node:fs';
import {config, projectDist, projectSrc} from './tikui-loader';
import { onDocResources, sassRender } from './doc-resources';
import { onExposedResources } from './exposed-resources';
import { copy, type CopyOptions } from './copy';

const options: CopyOptions = {
  overwrite: true,
  expand: true,
  dot: true,
  junk: true,
  filter: [
    '**/*',
    '!**/*.scss',
    '!**/*.pug'
  ],
};

const libOptions: CopyOptions = {
  overwrite: true,
};

if (!fs.existsSync(projectDist)) {
  fs.mkdirSync(projectDist);
}

const manageCopy = (source: string, dest: string, copyOptions: CopyOptions) => copy(source, dest, {
  ...copyOptions,
  onFileCopied: (copyOperation) => {
    if (config.verbose) {
      console.info(`${copyOperation.src} => ${copyOperation.dest}`);
    }
  },
}).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

const manageSassCopy = (from: string, to: string) => {
  const toDir = path.dirname(to);
  const rendered = sassRender(from);
  fs.mkdirSync(toDir, {recursive: true});
  fs.writeFileSync(to, rendered);
  if (config.verbose) {
    console.info(`${from} => ${to} using SCSS`);
  }
};

manageCopy(projectSrc, projectDist, options);

onLibResources((from, to) => manageCopy(from, path.resolve(projectDist, to), libOptions));

onDocResources((from, to, type) => {
  const dest = path.resolve(projectDist, to);
  switch (type) {
    case 'copy':
      manageCopy(from, dest, libOptions);
      break;
    case 'scss':
      manageSassCopy(from, dest);
      break;
  }
});

onExposedResources((from, to) => manageCopy(from, path.resolve(projectDist, to), libOptions));

