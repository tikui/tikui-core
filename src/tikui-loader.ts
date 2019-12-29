import * as path from 'path';

export const project = process.env.NODE_ENV === 'test' ? path.resolve(__dirname, '..', 'test', 'faketikui') : process.cwd();

export const config = require(path.resolve(project, 'tikuiconfig.json'));
