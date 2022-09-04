import path from 'path';

export const project = process.env.TIKUI_PATH || process.cwd();

type ExposedResources = Record<string, string>;

interface TikuiConfig {
  documentation: string;
  src?: string;
  dist?: string;
  cache?: string;
  expose?: ExposedResources;
  port?: number;
}

export const config: TikuiConfig = require(path.resolve(project, 'tikuiconfig.json'));

const optionalOr = <T>(value: T | undefined, defaultValue: T): T => value === undefined ? defaultValue : value;

const distDir = optionalOr(config.dist, 'dist');
const srcDir = optionalOr(config.src, 'src');
const cacheDir = optionalOr(config.cache, '.tikui-cache');

export const projectSrc = path.resolve(project, srcDir);
export const projectDist = path.resolve(project, distDir);
export const projectCache = path.resolve(project, cacheDir);
export const port = optionalOr(config.port, 3000);
