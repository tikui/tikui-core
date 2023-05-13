import { onLibResources } from './lib-resources';

const copy = require('recursive-copy');
import path from 'path';
import fs from 'fs';
import { projectDist, projectSrc } from './tikui-loader';
import { onDocResources, sassRender } from './doc-resources';
import { onExposedResources } from './exposed-resources';

const options: any = {
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

const libOptions: any = {
  overwrite: true,
};

if (!fs.existsSync(projectDist)) {
  fs.mkdirSync(projectDist);
}

const manageCopy = (...copyargs: any[]) => copy(...copyargs)
  .on(
    (copyOperation: any) => {
      if (!process.argv[2]) return
      console.info(`${copyOperation.src} => ${copyOperation.dest}`)
    },
  )
  .on(
    copy.events.ERROR,
    (copyOperation: any) => console.error(`Failing to copy file from ${copyOperation.src} to ${copyOperation.dest}`),
  )
  .catch((err: any) => console.error('Error during copy', err))
;

const manageSassCopy = (from: string, to: string) => {
  const toDir = path.dirname(to);
  const rendered = sassRender(from);
  fs.mkdirSync(toDir, {recursive: true});
  fs.writeFileSync(to, rendered);
  if (!process.argv[2]) return
  console.info(`${from} => ${to} using SCSS`);
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

