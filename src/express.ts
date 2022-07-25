import express, { NextFunction, Request, Response } from 'express';
import watch from 'node-watch';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { onLibResources } from './lib-resources';
import * as options from './options.dev';
import { project } from './tikui-loader';
import { onDocResources, sassRender } from './doc-resources';
import { onExposedResources } from './exposed-resources';
import { renderPugFile } from './pug-util';

const reload = require('reload');

const app = express();

const srcDir: string = path.resolve(project, 'src');
const cacheDir: string = path.resolve(project, 'cache');

app.use(cors());

// Set views to sources files
app.set('views', srcDir);

// Create path
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

const toHtml = renderPugFile(options);

// Compiled resources
const renderPage = (res: Response, next: NextFunction) => (filename: string) => {
  const pugUri = filename + '.pug';
  const filepath = path.resolve(srcDir, pugUri);
  if(fs.existsSync(filepath)) {
    return res.send(toHtml(filepath));
  }
  return next();
};

app.use(/^\/$/, (req: Request, res: Response, next: NextFunction) => {
  renderPage(res, next)('index');
});

app.use(/^(.+)\/$/, (req: Request, res: Response, next: NextFunction) => {
  const uri = req.baseUrl.replace(/^\/(.+)$/, '$1/index');
  renderPage(res, next)(uri);
});

app.use(/^\/(.+).html$/, (req: Request, res: Response, next: NextFunction) => {
  const uri = req.baseUrl.replace(/^\/(.+).html$/, '$1');
  renderPage(res, next)(uri);
});

app.use(/^\/(.+).css$/, (req: Request, res: Response, next: NextFunction) => {
  const cssUri = req.baseUrl.replace(/^\/(.+).css/, '$1.css');
  const cssCacheUrl = path.resolve(cacheDir, cssUri);
  if (!fs.existsSync(cssCacheUrl)) {
    return next();
  }
  res.set('Content-Type', 'text/css');
  res.send(fs.readFileSync(cssCacheUrl));
});

// Public resources
app.use('/', express.static(srcDir));

onLibResources((absoluteFrom, relativeTo) => app.use(
  `/${relativeTo}`,
  express.static(absoluteFrom),
));

onDocResources((absoluteFrom, relativeTo, type) => {
  const uriTo = `/${relativeTo}`;
  switch (type) {
    case 'copy':
      app.use(
        uriTo,
        express.static(absoluteFrom),
      );
      break;
    case 'scss':
      app.use(
        uriTo,
        (req: Request, res: Response) => {
          res.set('Content-Type', 'text/css');
          res.send(sassRender(absoluteFrom));
        }
      );
      break;
  }
});

onExposedResources((absoluteFrom, relativeTo) => app.use(
  `/${relativeTo}`,
  express.static(absoluteFrom),
));

// Create server
app.listen(3000, () => console.log('Styles are available at http://localhost:3000/'));

// Watch on pug and css files
reload(app).then((reloadReturned: any) => {
  watch([
    srcDir,
    cacheDir
  ], {
    recursive: true
  }, (evt: any, name: any) => {
    if (typeof name === 'string' && !(name.match(/^(.+).scss$/))) {
      reloadReturned.reload();
    }
  });
}).catch((err: any) => {
  console.error('Reload could not start, could not start Tikui app', err);
});
