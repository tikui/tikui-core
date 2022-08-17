import path from 'path';

export const project = process.env.TIKUI_PATH || process.cwd();

type ExposedResources = Record<string, string>;

interface TikuiConfig {
  documentation: string;
  src?: string;
  dist?: string;
  expose?: ExposedResources;
  port?: number;
}

export const config: TikuiConfig = require(path.resolve(project, 'tikuiconfig.json'));

const optionalOr = <T>(value: T | undefined, defaultValue: T): T => value === undefined ? defaultValue : value;

const distDir = optionalOr(config.dist, 'dist');
const srcDir = optionalOr(config.src, 'src');

export const projectSrc = path.resolve(project, srcDir);
export const projectDist = path.resolve(project, distDir);
export const port = optionalOr(config.port, 3000);
