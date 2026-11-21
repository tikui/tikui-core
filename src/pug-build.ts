import { Transform } from 'node:stream';
import {config, projectDist, projectSrc} from './tikui-loader';
import options from './options';
import { renderPugFile } from './pug-util';
import { copy, type CopyOptions } from './copy';

const toHtml = renderPugFile(options);

const transform = (source: string) => new Transform({
  transform: (_, __, done) => done(),
  flush(done) {
    try {
      this.push(toHtml(source));
      done();
    } catch (err: unknown) {
      done(err as Error);
    }
  },
});

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
    (_, copyOperation) => {
      console.error(`Failing to copy file from ${copyOperation.src} to ${copyOperation.dest}`);
      process.exitCode = 1;
    },
  )
  .catch((err: unknown) => {
    console.error('Error during copy', err);
    process.exitCode = 1;
  })
;

managePugCopy(projectSrc, projectDist, pugCopy);
