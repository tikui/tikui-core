import path from 'path';

export const project = process.env.TIKUI_PATH || process.cwd();

type ExposedResources = Record<string, string>;

interface TikuiConfig {
  documentation: string;
  src?: string;
  dist?: string;
  expose?: ExposedResources;
}

export const config: TikuiConfig = require(path.resolve(project, 'tikuiconfig.json'));

const distDir = config.dist === undefined ? 'dist' : config.dist;
const srcDir = config.src === undefined ? 'src' : config.src;

export const projectSrc = path.resolve(project, srcDir);
export const projectDist = path.resolve(project, distDir);
