import * as path from 'path';
import * as pug from 'pug';
import { project } from './tikui-loader';
import * as through2 from 'through2';
import options = require('./options');

const srcDir: string = path.resolve(project, 'src');
const distDir: string = path.resolve(project, 'dist');

const copy = require('recursive-copy');


const pugCopy: any = {
  overwrite: true,
  expand: true,
  dot: true,
  junk: true,
  rename: (filepath: string) => filepath.replace(/\.pug$/, '.html'),
  transform: (source: string) => through2((_, __, done) => {
    done(null, pug.renderFile(source, options));
  }),
  filter: [
    '**/*.pug'
  ],
};


const managePugCopy = (...copyargs: any[]) => copy(...copyargs)
  .on(
    copy.events.COPY_FILE_COMPLETE,
    (copyOperation: any) => console.info(`${copyOperation.src} => ${copyOperation.dest} using Pug`),
  )
  .on(
    copy.events.ERROR,
    (copyOperation: any) => console.error(`Failing to copy file from ${copyOperation.src} to ${copyOperation.dest}`),
  )
  .catch((err: any) => console.error('Error during copy', err))
;

managePugCopy(srcDir, distDir, pugCopy);
