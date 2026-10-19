#!/usr/bin/env node

import concurrently, { CloseEvent, ConcurrentlyCommandInput } from 'concurrently';
import path from 'node:path';
import { rimrafSync } from 'rimraf';
import { Command } from 'commander';
import { projectCache, projectDist, projectNodeModules, projectSrc } from './tikui-loader';
import fs from 'node:fs';

const BUILD_DIR = path.resolve(import.meta.dirname, '..', 'dist');

// node_modules is given through SASS_PATH instead of -I: sass --watch watches -I load paths (but not SASS_PATH),
// and crashes when a folder is created then removed or renamed in node_modules (e.g. by Vite's dependency optimizer).
const SASS_CACHE = `npx sass "${projectSrc}":"${projectCache}" -s expanded --watch`;
const EXPRESS_SERVE = `node "${path.resolve(BUILD_DIR, 'express.js')}"`;
const SASS_BUILD = `npx sass -I "${projectNodeModules}" "${projectSrc}":"${projectDist}" -s compressed --source-map --embed-sources`;
const ASSETS_BUILD = `node "${path.resolve(BUILD_DIR, 'assets-build.js')}"`;
const PUG_BUILD = `node "${path.resolve(BUILD_DIR, 'pug-build.js')}"`;
const EXPRESS_PREVIEW = `node "${path.resolve(BUILD_DIR, 'preview.js')}"`;

const filterInterruptionErrorFor = (subject: string) => async (errors: unknown) => {
  if (Array.isArray(errors) && errors.every(error => error.exitCode === 'SIGINT')) {
    console.log(`${subject} exited normally by interruption.`);

    return;
  }

  console.error(`${subject} failed with following errors:`, errors);
  process.exit(1);
};

const launchFor = (subject: string, ...commands: ConcurrentlyCommandInput[]) => async () => {
  console.log(`${subject} in progress, please use Ctrl-C to exit.`);
  const { result } = concurrently(commands)
  await result.then().catch(filterInterruptionErrorFor(subject));
}

const serve = launchFor(
  'Serve',
  { command: SASS_CACHE, name: 'scss', env: { SASS_PATH: projectNodeModules } },
  { command: EXPRESS_SERVE, name: 'express' },
);

const preview = launchFor('Preview', { command: EXPRESS_PREVIEW, name: 'express' });

const ordered = (...commands: string[]) => commands.join(' && ');

const build = () => {
  console.log(`Building on ${projectDist} directory.`);
  rimrafSync(projectDist);
  fs.mkdirSync(projectDist, {
    recursive: true,
  });
  const { result } = concurrently([
    { command: SASS_BUILD, name: 'scss' },
    { command: ordered(ASSETS_BUILD, PUG_BUILD), name: 'pug' },
  ]);
  result.then().catch((executions: CloseEvent[]): void => {
    const firstCode = executions
      .map((execution) => execution.exitCode)
      .find((code): code is number => typeof code === 'number' && code > 0);
    console.error('Build failed, first error code found:', firstCode);
    return process.exit(firstCode);
  });
};

const program = new Command();

program
  .command('serve')
  .action(serve);

program
  .command('preview')
  .action(preview);

program
  .command('build')
  .action(build);

program
  .name('tikui')
  .parse(process.argv);
