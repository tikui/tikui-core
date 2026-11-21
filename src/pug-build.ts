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


const managePugCopy = (source: string, dest: string, copyOptions: CopyOptions) => copy(source, dest, {
  ...copyOptions,
  onFileCopied: (copyOperation) => {
    if (config.verbose) {
      console.info(`${copyOperation.src} => ${copyOperation.dest} using Pug`);
    }
  },
}).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

managePugCopy(projectSrc, projectDist, pugCopy);
