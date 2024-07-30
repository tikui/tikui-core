import {config, projectDist, projectSrc} from './tikui-loader';
import through2 from 'through2';
import copy from 'recursive-copy';
import options = require('./options');
import { renderPugFile } from './pug-util';

const toHtml = renderPugFile(options);

const transform = (source: string) => through2((_, __, done) => done(null, toHtml(source)));

const pugCopy: any = {
  overwrite: true,
  expand: true,
  dot: true,
  junk: true,
  rename: (filepath: string) => filepath.replace(/\.pug$/, '.html'),
  transform,
  filter: [
    '**/*.pug'
  ],
};


const managePugCopy = (...copyargs: [any, any, any]) => copy(...copyargs)
  .on(
    copy.events.COPY_FILE_COMPLETE,
    (copyOperation: any) => {
      if (config.verbose) {
        console.info(`${copyOperation.src} => ${copyOperation.dest} using Pug`);
      }
    },
  )
  .on(
    copy.events.ERROR,
    (copyOperation: any) => console.error(`Failing to copy file from ${copyOperation.src} to ${copyOperation.dest}`),
  )
  .catch((err: any) => console.error('Error during copy', err))
;

managePugCopy(projectSrc, projectDist, pugCopy);
