import {config, projectDist, projectSrc} from './tikui-loader';
import through2 from 'through2';
import options from './options';
import { renderPugFile } from './pug-util';
import { copy, type CopyOptions } from './copy';

const toHtml = renderPugFile(options);

const transform = (source: string) => through2((_, __, done) => done(null, toHtml(source)));

const pugCopy: CopyOptions = {
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


const managePugCopy = (source: string, dest: string, copyOptions: CopyOptions) => copy(source, dest, copyOptions)
  .on(
    copy.events.COPY_FILE_COMPLETE,
    (copyOperation) => {
      if (config.verbose) {
        console.info(`${copyOperation.src} => ${copyOperation.dest} using Pug`);
      }
    },
  )
  .on(
    copy.events.ERROR,
    (_, copyOperation) => console.error(`Failing to copy file from ${copyOperation.src} to ${copyOperation.dest}`),
  )
  .catch((err: unknown) => console.error('Error during copy', err))
;

managePugCopy(projectSrc, projectDist, pugCopy);
