import path from 'path';

export const project = process.env.TIKUI_PATH || process.cwd();

export const config = require(path.resolve(project, 'tikuiconfig.json'));
