import path from 'node:path';

process.env.TIKUI_PATH = path.resolve(import.meta.dirname, 'test/faketikui');
