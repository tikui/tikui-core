#!/usr/bin/env node

import concurrently from 'concurrently';
import path from 'path';
import { rimrafSync } from 'rimraf';
import { Command } from 'commander';
import { projectCache, projectDist, projectNodeModules, projectSrc } from './tikui-loader';
import fs from 'fs';

const BUILD_DIR = path.resolve(__dirname, '..', 'dist');

const SASS_CACHE = `npx sass -I "${projectNodeModules}" "${projectSrc}":"${projectCache}" -s expanded --watch`;
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

const launchFor = (subject: string, ...commands: string[]) => async () => {
  console.log(`${subject} in progress, please use Ctrl-C to exit.`);
  const { result } = concurrently(commands)
  await result.then().catch(filterInterruptionErrorFor(subject));
}

const serve = launchFor('Serve', SASS_CACHE, EXPRESS_SERVE);

const preview = launchFor('Preview', EXPRESS_PREVIEW);

const ordered = (...commands: string[]) => commands.join(' && ');

const build = () => {
  console.log(`Building on ${projectDist} directory.`);
  rimrafSync(projectDist);
  fs.mkdirSync(projectDist, {
    recursive: true,
  });
  const { result } = concurrently([
    SASS_BUILD,
    ordered(ASSETS_BUILD, PUG_BUILD),
  ]);
  result.then().catch((executions): void => {
    const firstCode = executions.map((execution: any) => execution.exitCode).find((code: any) => code > 0);
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
