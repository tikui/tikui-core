import express, { NextFunction, Request, Response } from 'express';
import watch from 'node-watch';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { onLibResources } from './lib-resources';
import * as options from './options.dev';
import { port, projectCache, projectSrc } from './tikui-loader';
import { onDocResources, sassRender } from './doc-resources';
import { onExposedResources } from './exposed-resources';
import { renderPugFile } from './pug-util';

const reload = require('reload');

const app = express();

app.use(cors());

// Set views to source files
app.set('views', projectSrc);

// Create path
if (!fs.existsSync(projectCache)) {
  fs.mkdirSync(projectCache, {recursive: true});
}

const toHtml = renderPugFile(options);

// Compiled resources
const renderPage = (res: Response, next: NextFunction) => (filename: string) => {
  const pugUri = filename + '.pug';
  const filepath = path.resolve(projectSrc, pugUri);
  if(fs.existsSync(filepath)) {
    return res.send(toHtml(filepath));
  }
  return next();
};

app.use(/^\/$/, (_, res: Response, next: NextFunction) => {
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
  const cssCacheUrl = path.resolve(projectCache, cssUri);
  if (!fs.existsSync(cssCacheUrl)) {
    return next();
  }
  res.set('Content-Type', 'text/css');
  res.send(fs.readFileSync(cssCacheUrl));
});

// Public resources
app.use('/', express.static(projectSrc));

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
        (_, res: Response) => {
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
app.listen(port, () => console.log(`Styles are available at http://localhost:${port}/`));

// Watch on pug and css files
reload(app).then((reloadReturned: any) => {
  watch([
    projectSrc,
    projectCache,
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
